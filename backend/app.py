from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import json
import os
import fitz  # PyMuPDF for PDF processing
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

hardcoded_answers = {
    "What is this project?":
      "This project is to build an Account Onboarding and Identity Verification System for Dundermifflin. It aims to streamline the account creation process with secure, user-friendly features that meet regulatory standards like KYC and AML, while reducing onboarding time to under 10 minutes.",
    "How will user data be protected?":
      "User data is secured with AES-256 encryption for both storage and transfer, multi-factor authentication (MFA), and GDPR-compliant handling, ensuring robust security throughout the onboarding process.",
    "Who is the best to contact for assistance with an API issue?":
      "For debugging API issues, the primary point of contact would be the Backend Tech Lead. They oversee the server-side code and API development and can provide guidance on troubleshooting, best practices, and debugging strategies. If the issue involves integration with frontend components, the Frontend Tech Lead can also offer insights into client-server communication aspects.",
    "What are the core technologies?":
      "The team primarily uses React for the frontend, Node.js for the backend, PostgreSQL and MongoDB for databases, and AWS for infrastructure, with containerization handled by Docker and Kubernetes."
}

# Paths to JSON files
CONVERSATIONS_FILE = 'data/conversations.json'
MESSAGES_FILE = 'data/messages.json'
USER_FILE = 'data/user.json'
EVENTS_FILE = 'data/events.json'
PDF_CHATS_FILE = 'data/pdf_chats.json'

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables!")
    print("Please create a .env file with your OpenAI API key.")
    client = None
else:
    client = OpenAI(api_key=api_key)

# Global variable to store uploaded PDF text (for backward compatibility)
pdf_text_content = None
current_pdf_session = None

def load_data(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)
    return {}

def save_data(file_path, data):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

# Route to handle login and save user data
@app.route('/login', methods=['POST'])
def login():
    user_data = request.json
    user = {
        "userId": user_data.get("username"),
        "name": f"User {user_data.get('username')}"
    }
    save_data(USER_FILE, user)
    return jsonify(user), 201

# Route to retrieve the current user data
@app.route('/user', methods=['GET'])
def get_user():
    user = load_data(USER_FILE)
    return jsonify(user)

# Route to fetch all conversations
@app.route('/conversations', methods=['GET'])
def get_all_conversations():
    conversations = load_data(CONVERSATIONS_FILE)
    return jsonify(list(conversations.values())), 200

# Route to retrieve a single conversation by its ID
@app.route('/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    conversations = load_data(CONVERSATIONS_FILE)
    conversation = conversations.get(conversation_id, {})
    return jsonify(conversation)

# Route to fetch messages for a specific conversation
@app.route('/conversations/<conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    messages = load_data(MESSAGES_FILE)
    conversation_messages = messages.get(conversation_id, [])
    return jsonify(conversation_messages), 200

# Route to add a new message to a conversation
@app.route('/conversations/<conversation_id>/messages', methods=['POST'])
def post_conversation_message(conversation_id):
    message_data = request.json
    messages = load_data(MESSAGES_FILE)

    new_message = {
        "text": message_data.get("text"),
        "senderId": message_data.get("senderId"),
        "timestamp": message_data.get("timestamp")
    }

    if conversation_id not in messages:
        messages[conversation_id] = []
    messages[conversation_id].append(new_message)

    save_data(MESSAGES_FILE, messages)
    return jsonify(new_message), 201

# Function to extract text from PDF
def extract_text_from_pdf(pdf_data):
    text = ""
    with fitz.open(stream=pdf_data, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Endpoint to upload PDF and prepare it for Q&A
@app.route("/upload_pdf", methods=["POST"])
@cross_origin(origin="http://localhost:5173")
def upload_pdf():
    global pdf_text_content, current_pdf_session

    if not client:
        return jsonify({"error": "OpenAI API key not configured"}), 500

    pdf_file = request.files.get("file")
    if not pdf_file:
        return jsonify({"error": "No file uploaded"}), 400

    # Extract text from PDF and store it
    pdf_text_content = extract_text_from_pdf(pdf_file.read())

    if not pdf_text_content or len(pdf_text_content.strip()) == 0:
        return jsonify({"error": "Could not extract text from PDF"}), 400

    # Generate a summary of the PDF using OpenAI
    try:
        summary_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes documents. Provide a concise summary highlighting the key points."},
                {"role": "user", "content": f"Please provide a brief summary of this document:\n\n{pdf_text_content[:8000]}"}
            ],
            max_tokens=200,
            temperature=0.5
        )
        summary = summary_response.choices[0].message.content
    except Exception as e:
        return jsonify({"error": f"Error generating summary: {str(e)}"}), 500

    # Create a new PDF chat session
    import uuid
    from datetime import datetime

    session_id = str(uuid.uuid4())
    current_pdf_session = session_id

    # Load existing PDF chats
    pdf_chats = {}
    if os.path.exists(PDF_CHATS_FILE):
        with open(PDF_CHATS_FILE, 'r') as f:
            try:
                pdf_chats = json.load(f)
            except json.JSONDecodeError:
                pdf_chats = {}

    # Store the new session
    pdf_chats[session_id] = {
        "pdf_name": pdf_file.filename,
        "pdf_text": pdf_text_content,
        "created_at": datetime.now().isoformat(),
        "messages": [
            {
                "role": "assistant",
                "content": summary,
                "timestamp": datetime.now().isoformat()
            }
        ]
    }

    # Save to file
    with open(PDF_CHATS_FILE, 'w') as f:
        json.dump(pdf_chats, f, indent=4)

    return jsonify({
        "message": "PDF uploaded and processed successfully",
        "session_id": session_id,
        "summary": summary,
        "pdf_name": pdf_file.filename
    }), 200

@app.route("/ask_question", methods=["POST"])
def ask_question():
    global pdf_text_content, current_pdf_session

    if not client:
        return jsonify({"error": "OpenAI API key not configured. Please set OPENAI_API_KEY in .env file"}), 500

    data = request.json
    question = data.get("question")
    session_id = data.get("session_id", current_pdf_session)

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Check if the question has a hardcoded answer
    if question in hardcoded_answers:
        answer = hardcoded_answers[question]
    else:
        # Load the PDF chat session
        pdf_chats = {}
        if os.path.exists(PDF_CHATS_FILE) and session_id:
            with open(PDF_CHATS_FILE, 'r') as f:
                try:
                    pdf_chats = json.load(f)
                except json.JSONDecodeError:
                    pdf_chats = {}

        # Get the PDF context from the session
        session_data = pdf_chats.get(session_id, {})
        pdf_context = session_data.get("pdf_text", pdf_text_content)

        # Build conversation history for context
        conversation_history = session_data.get("messages", [])

        # Build the prompt for OpenAI
        if pdf_context:
            # If PDF has been uploaded, use it as context
            system_message = "You are a helpful assistant that answers questions based on the provided document context. Give clear, concise answers."

            # Build messages array with conversation history
            messages = [{"role": "system", "content": system_message}]

            # Add previous conversation context (last 5 messages for efficiency)
            for msg in conversation_history[-5:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

            # Add current question with document context
            messages.append({
                "role": "user",
                "content": f"Based on the following document, answer this question: {question}\n\nDocument:\n{pdf_context[:8000]}"
            })
        else:
            # No PDF uploaded, answer general questions
            system_message = "You are a helpful assistant for a virtual office platform. Answer questions about workplace topics, onboarding, and general office-related queries."
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": question}
            ]

        try:
            # Call OpenAI API
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )

            answer = response.choices[0].message.content

        except Exception as e:
            return jsonify({"error": f"Error calling OpenAI API: {str(e)}"}), 500

    # Store the question and answer in the session
    from datetime import datetime

    if session_id and os.path.exists(PDF_CHATS_FILE):
        with open(PDF_CHATS_FILE, 'r') as f:
            try:
                pdf_chats = json.load(f)
            except json.JSONDecodeError:
                pdf_chats = {}

        if session_id in pdf_chats:
            pdf_chats[session_id]["messages"].extend([
                {
                    "role": "user",
                    "content": question,
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "role": "assistant",
                    "content": answer,
                    "timestamp": datetime.now().isoformat()
                }
            ])

            with open(PDF_CHATS_FILE, 'w') as f:
                json.dump(pdf_chats, f, indent=4)

    return jsonify({"answer": answer}), 200

# Endpoint to get chat history for a session
@app.route("/get_chat_history/<session_id>", methods=["GET"])
def get_chat_history(session_id):
    if not os.path.exists(PDF_CHATS_FILE):
        return jsonify({"messages": []}), 200

    with open(PDF_CHATS_FILE, 'r') as f:
        try:
            pdf_chats = json.load(f)
        except json.JSONDecodeError:
            return jsonify({"messages": []}), 200

    session_data = pdf_chats.get(session_id, {})
    messages = session_data.get("messages", [])
    pdf_name = session_data.get("pdf_name", "")

    return jsonify({
        "messages": messages,
        "pdf_name": pdf_name
    }), 200

def load_events():
    """Load events from the JSON file."""
    if os.path.exists(EVENTS_FILE):
        with open(EVENTS_FILE, 'r') as file:
            try:
                return json.load(file)
            except json.JSONDecodeError:
                # Return an empty list if the file is empty or corrupted
                return []
    return []

def save_events(events):
    """Save events to the JSON file."""
    with open(EVENTS_FILE, 'w') as file:
        json.dump(events, file, indent=4)

# Route to fetch all events
@app.route('/events', methods=['GET'])
def get_events():
    events = load_events()
    return jsonify(events)

# Route to add a new event
@app.route('/events', methods=['POST'])
def add_event():
    event_data = request.json  # Get event data from request

    # Load existing events
    events = load_events()

    for event in events:
        if (event["title"] == event_data.get("title") and
                event["start"] == event_data.get("start") and
                event["end"] == event_data.get("end")):
            return jsonify({"error": "Event already exists"}), 400

    # Add new event with a unique ID (based on existing number of events)
    new_event = {
        "id": len(events) + 1,
        "title": event_data.get("title"),
        "start": event_data.get("start"),
        "end": event_data.get("end"),
        "person": event_data.get("person"),
        "description": event_data.get("description")
    }
    events.append(new_event)

    # Save updated events to the file
    save_events(events)

    return jsonify(new_event), 201

# Ensure necessary directories and files are set up
if __name__ == "__main__":
    os.makedirs('data', exist_ok=True)
    for file_name in [CONVERSATIONS_FILE, MESSAGES_FILE, USER_FILE, PDF_CHATS_FILE]:
        if not os.path.exists(file_name):
            with open(file_name, 'w') as f:
                json.dump({}, f)
    app.run(debug=True, use_reloader=False)
