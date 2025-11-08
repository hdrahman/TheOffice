from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import json
import os
import fitz  # PyMuPDF for PDF processing
import faiss
import numpy as np
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

hardcoded_answers = {
    "What is this project?":
      "This project is to build an Account Onboarding and Identity Verification System for Atom Bank. It aims to streamline the account creation process with secure, user-friendly features that meet regulatory standards like KYC and AML, while reducing onboarding time to under 10 minutes.",
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

# Load Embedding Model
embedding_model = SentenceTransformer("sentence-transformers/multi-qa-mpnet-base-dot-v1")  # Optimized for QA tasks
embedding_index = None

# Load a large generative model for question answering
qa_model_name = "google/flan-t5-large"
qa_tokenizer = AutoTokenizer.from_pretrained(qa_model_name)
qa_model = AutoModelForSeq2SeqLM.from_pretrained(qa_model_name)

# Global variables to store chunks and embeddings
chunks = []
chunk_embeddings = []

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

# Function to chunk text into smaller pieces with overlap
def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks

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
    global embedding_index, chunks, chunk_embeddings
    
    pdf_file = request.files.get("file")
    if not pdf_file:
        return jsonify({"error": "No file uploaded"}), 400

    pdf_text = extract_text_from_pdf(pdf_file.read())
    chunks = chunk_text(pdf_text)

    # Generate embeddings for each chunk
    chunk_embeddings = [embedding_model.encode(chunk) for chunk in chunks]
    chunk_embeddings = np.array(chunk_embeddings)

    # Initialize FAISS index
    embedding_dim = chunk_embeddings.shape[1]
    embedding_index = faiss.IndexFlatL2(embedding_dim)
    embedding_index.add(chunk_embeddings)

    return jsonify({"message": "PDF uploaded and processed successfully"}), 200

@app.route("/ask_question", methods=["POST"])
def ask_question():
    global embedding_index, chunks, chunk_embeddings

    data = request.json
    question = data.get("question")

    # Check if the question has a hardcoded answer
    if question in hardcoded_answers:
        return jsonify({"answer": hardcoded_answers[question]}), 200

    if not embedding_index or not chunks:
        return jsonify({"error": "No PDF has been uploaded yet"}), 400

    # Otherwise, continue with embedding model and T5 model for answering
    question_embedding = embedding_model.encode(question)
    _, indices = embedding_index.search(np.array([question_embedding]), k=1)
    most_relevant_chunk = chunks[indices[0][0]]

    input_text = f"Generate a detailed answer to the following question based on the provided context. Question: {question} Context: {most_relevant_chunk}"
    inputs = qa_tokenizer(input_text, return_tensors="pt")
    outputs = qa_model.generate(
        **inputs,
        max_length=200,
        num_beams=5,
        no_repeat_ngram_size=2
    )
    answer = qa_tokenizer.decode(outputs[0], skip_special_tokens=True)

    return jsonify({"answer": answer}), 200

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
    for file_name in [CONVERSATIONS_FILE, MESSAGES_FILE, USER_FILE]:
        if not os.path.exists(file_name):
            with open(file_name, 'w') as f:
                json.dump({}, f)
    app.run(debug=True, use_reloader=False)
