from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import fitz  # PyMuPDF for PDF processing
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from functools import wraps
from datetime import datetime
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    print("WARNING: Supabase credentials not found!")
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)
    print(f"✓ Connected to Supabase: {supabase_url}")

# Initialize OpenAI client
openai_key = os.getenv('OPENAI_API_KEY')
if not openai_key:
    print("WARNING: OPENAI_API_KEY not found!")
    openai_client = None
else:
    openai_client = OpenAI(api_key=openai_key)
    print("✓ OpenAI client initialized")

# ============================================
# AUTH MIDDLEWARE
# ============================================

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ Auth failed: Missing or invalid authorization header")
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header.split('Bearer ')[1]

        try:
            # Verify JWT token with Supabase by making authenticated request
            response = supabase.auth.get_user(token)

            # Set user info on request object
            request.user_id = response.user.id
            request.user_email = response.user.email

            print(f"✓ Auth success for user: {response.user.email} (ID: {response.user.id})")
            return f(*args, **kwargs)
        except Exception as e:
            print(f"❌ Auth failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Invalid or expired token", "details": str(e)}), 401

    return decorated_function

# ============================================
# AUTH ROUTES
# ============================================

@app.route('/auth/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    full_name = data.get('full_name', '')

    if not email or not password or not username:
        return jsonify({"error": "Email, password, and username are required"}), 400

    try:
        # Sign up with Supabase Auth
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "username": username,
                    "full_name": full_name
                }
            }
        })

        if response.user:
            return jsonify({
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "username": username,
                    "full_name": full_name
                },
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token
                } if response.session else None
            }), 201
        else:
            return jsonify({"error": "Signup failed"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/auth/login', methods=['POST'])
def login():
    """Log in an existing user"""
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        # Sign in with Supabase Auth
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if response.user and response.session:
            # Get user profile from database
            user_profile = supabase.table('users').select('*').eq('id', response.user.id).execute()

            profile = user_profile.data[0] if user_profile.data else {
                "id": response.user.id,
                "email": response.user.email,
                "username": response.user.email.split('@')[0]
            }

            return jsonify({
                "user": profile,
                "session": {
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        return jsonify({"error": "Invalid credentials", "details": str(e)}), 401

@app.route('/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Log out the current user"""
    try:
        supabase.auth.sign_out()
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/auth/me', methods=['GET'])
@require_auth
def get_current_user():
    """Get current user profile"""
    try:
        user_profile = supabase.table('users').select('*').eq('id', request.user_id).execute()

        if user_profile.data:
            return jsonify(user_profile.data[0]), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# CONVERSATIONS ROUTES
# ============================================

@app.route('/conversations', methods=['GET'])
@require_auth
def get_conversations():
    """Get all conversations for the current user"""
    try:
        print(f"📨 Fetching conversations for user: {request.user_id}")

        # Get conversations where user is a participant
        result = supabase.table('conversation_participants').select(
            'conversation_id, conversations(*)'
        ).eq('user_id', request.user_id).execute()

        print(f"✓ Found {len(result.data)} participant records")

        conversations = [item['conversations'] for item in result.data if item.get('conversations')]

        print(f"✓ Returning {len(conversations)} conversations")
        return jsonify(conversations), 200
    except Exception as e:
        print(f"❌ Error in get_conversations: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/conversations/<conversation_id>', methods=['GET'])
@require_auth
def get_conversation(conversation_id):
    """Get a specific conversation"""
    try:
        # Verify user is participant
        participant = supabase.table('conversation_participants').select('*').eq(
            'conversation_id', conversation_id
        ).eq('user_id', request.user_id).execute()

        if not participant.data:
            return jsonify({"error": "Not authorized"}), 403

        conversation = supabase.table('conversations').select('*').eq('id', conversation_id).execute()

        if conversation.data:
            return jsonify(conversation.data[0]), 200
        else:
            return jsonify({"error": "Conversation not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/conversations', methods=['POST'])
@require_auth
def create_conversation():
    """Create a new conversation"""
    data = request.json

    try:
        # Create conversation
        conversation = supabase.table('conversations').insert({
            "type": data.get('type', 'direct'),
            "name": data.get('name'),
            "description": data.get('description'),
            "created_by": request.user_id
        }).execute()

        conv_id = conversation.data[0]['id']

        # Add creator as participant
        supabase.table('conversation_participants').insert({
            "conversation_id": conv_id,
            "user_id": request.user_id,
            "role": "admin"
        }).execute()

        # Add other participants if provided
        participant_ids = data.get('participant_ids', [])
        if participant_ids:
            participants = [
                {"conversation_id": conv_id, "user_id": uid}
                for uid in participant_ids
            ]
            supabase.table('conversation_participants').insert(participants).execute()

        return jsonify(conversation.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# MESSAGES ROUTES
# ============================================

@app.route('/conversations/<conversation_id>/messages', methods=['GET'])
@require_auth
def get_messages(conversation_id):
    """Get messages for a conversation"""
    try:
        # Verify user is participant
        participant = supabase.table('conversation_participants').select('*').eq(
            'conversation_id', conversation_id
        ).eq('user_id', request.user_id).execute()

        if not participant.data:
            return jsonify({"error": "Not authorized"}), 403

        # Get messages with sender info
        messages = supabase.table('messages').select(
            '*, users(id, username, full_name, avatar_url)'
        ).eq('conversation_id', conversation_id).order('created_at', desc=False).execute()

        return jsonify(messages.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/conversations/<conversation_id>/messages', methods=['POST'])
@require_auth
def send_message(conversation_id):
    """Send a message to a conversation"""
    data = request.json
    content = data.get('content') or data.get('text')  # Support both field names

    if not content:
        return jsonify({"error": "Message content is required"}), 400

    try:
        # Verify user is participant
        participant = supabase.table('conversation_participants').select('*').eq(
            'conversation_id', conversation_id
        ).eq('user_id', request.user_id).execute()

        if not participant.data:
            return jsonify({"error": "Not authorized"}), 403

        # Insert message
        message = supabase.table('messages').insert({
            "conversation_id": conversation_id,
            "sender_id": request.user_id,
            "content": content
        }).execute()

        # Get message with sender info
        message_with_sender = supabase.table('messages').select(
            '*, users(id, username, full_name, avatar_url)'
        ).eq('id', message.data[0]['id']).execute()

        # Emit WebSocket event to conversation room
        socketio.emit('new_message', {
            'conversation_id': conversation_id,
            'message': message_with_sender.data[0]
        }, room=conversation_id)

        return jsonify(message_with_sender.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# EVENTS/CALENDAR ROUTES
# ============================================

@app.route('/events', methods=['GET'])
@require_auth
def get_events():
    """Get all events for the current user"""
    try:
        print(f"📅 Fetching events for user: {request.user_id}")

        # Get events created by user or where user is attendee
        events = supabase.table('events').select('*').eq('created_by', request.user_id).execute()
        print(f"✓ Found {len(events.data)} events created by user")

        # Also get events where user is an attendee
        attendee_events = supabase.table('event_attendees').select(
            'events(*)'
        ).eq('user_id', request.user_id).execute()
        print(f"✓ Found {len(attendee_events.data)} events as attendee")

        all_events = events.data + [item['events'] for item in attendee_events.data if item.get('events')]

        # Remove duplicates
        seen = set()
        unique_events = []
        for event in all_events:
            if event and event['id'] not in seen:
                seen.add(event['id'])
                unique_events.append(event)

        print(f"✓ Returning {len(unique_events)} unique events")
        return jsonify(unique_events), 200
    except Exception as e:
        print(f"❌ Error in get_events: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/events', methods=['POST'])
@require_auth
def create_event():
    """Create a new event"""
    data = request.json

    if not data.get('title') or not data.get('start') or not data.get('end'):
        return jsonify({"error": "Title, start, and end are required"}), 400

    try:
        # Convert start/end to proper format if needed
        start_time = data.get('start')
        end_time = data.get('end')

        event = supabase.table('events').insert({
            "title": data.get('title'),
            "description": data.get('description'),
            "start_time": start_time,
            "end_time": end_time,
            "location": data.get('location'),
            "created_by": request.user_id
        }).execute()

        # Add attendees if provided
        attendee_ids = data.get('attendee_ids', [])
        if attendee_ids:
            attendees = [
                {"event_id": event.data[0]['id'], "user_id": uid, "status": "invited"}
                for uid in attendee_ids
            ]
            supabase.table('event_attendees').insert(attendees).execute()

        return jsonify(event.data[0]), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# PDF CHATBOT ROUTES (Keep existing functionality)
# ============================================

def extract_text_from_pdf(pdf_data):
    """Extract text from PDF"""
    text = ""
    with fitz.open(stream=pdf_data, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text

@app.route("/upload_pdf", methods=["POST"])
@require_auth
def upload_pdf():
    """Upload PDF and generate summary"""
    if not openai_client:
        return jsonify({"error": "OpenAI API key not configured"}), 500

    pdf_file = request.files.get("file")
    if not pdf_file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        # Extract text
        pdf_text = extract_text_from_pdf(pdf_file.read())

        if not pdf_text or len(pdf_text.strip()) == 0:
            return jsonify({"error": "Could not extract text from PDF"}), 400

        # Generate summary
        summary_response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes documents."},
                {"role": "user", "content": f"Summarize this document:\n\n{pdf_text[:8000]}"}
            ],
            max_tokens=200,
            temperature=0.5
        )
        summary = summary_response.choices[0].message.content

        # Store in session (could also store in Supabase)
        session_id = str(uuid.uuid4())

        return jsonify({
            "message": "PDF uploaded successfully",
            "session_id": session_id,
            "summary": summary,
            "pdf_name": pdf_file.filename,
            "pdf_text": pdf_text  # Include for Q&A
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error processing PDF: {str(e)}"}), 500

@app.route("/ask_question", methods=["POST"])
@require_auth
def ask_question():
    """Ask a question about uploaded PDF"""
    if not openai_client:
        return jsonify({"error": "OpenAI API not configured"}), 500

    data = request.json
    question = data.get("question")
    pdf_context = data.get("pdf_text", "")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant that answers questions based on documents."},
            {"role": "user", "content": f"Based on this document, answer: {question}\n\nDocument:\n{pdf_context[:8000]}"}
        ]

        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )

        answer = response.choices[0].message.content
        return jsonify({"answer": answer}), 200

    except Exception as e:
        return jsonify({"error": f"Error: {str(e)}"}), 500

# ============================================
# WEBSOCKET EVENTS
# ============================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f'Client connected: {request.sid}')
    emit('connected', {'data': 'Connected to WebSocket'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f'Client disconnected: {request.sid}')

@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Join a conversation room"""
    conversation_id = data.get('conversation_id')
    if conversation_id:
        join_room(conversation_id)
        print(f'Client {request.sid} joined conversation {conversation_id}')
        emit('joined_conversation', {'conversation_id': conversation_id})

@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    """Leave a conversation room"""
    conversation_id = data.get('conversation_id')
    if conversation_id:
        leave_room(conversation_id)
        print(f'Client {request.sid} left conversation {conversation_id}')

@socketio.on('typing')
def handle_typing(data):
    """Broadcast typing indicator"""
    conversation_id = data.get('conversation_id')
    user_id = data.get('user_id')
    username = data.get('username')

    if conversation_id:
        emit('user_typing', {
            'conversation_id': conversation_id,
            'user_id': user_id,
            'username': username
        }, room=conversation_id, include_self=False)

# ============================================
# HEALTH CHECK
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "supabase": "connected" if supabase else "not configured",
        "openai": "connected" if openai_client else "not configured"
    }), 200

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🚀 Office.io Backend Server Starting...")
    print("="*50)
    print(f"✓ Flask app initialized")
    print(f"✓ CORS enabled for all origins")
    print(f"✓ WebSocket enabled")
    print("="*50 + "\n")

    # Run with SocketIO
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
