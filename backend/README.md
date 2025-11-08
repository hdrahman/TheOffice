# Backend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure OpenAI API Key

Create a `.env` file in the `backend/` directory:

```bash
# Copy the example file
cp .env.example .env
```

Then edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Never commit your `.env` file to version control. It's already in `.gitignore`.

### 3. Run the Server

```bash
python app.py
```

The server will start at `http://localhost:5000`

## API Endpoints

### Chat & Conversations
- `POST /login` - User login
- `GET /user` - Get current user
- `GET /conversations` - Get all conversations
- `GET /conversations/<id>/messages` - Get messages
- `POST /conversations/<id>/messages` - Send message

### Events
- `GET /events` - Get all events
- `POST /events` - Create new event

### AI Chatbot
- `POST /upload_pdf` - Upload PDF for Q&A (multipart/form-data with 'file' field)
- `POST /ask_question` - Ask question (JSON body: `{"question": "your question"}`)

## Features

- **Simple Setup**: No conda, no FAISS, no multi-GB model downloads
- **OpenAI Integration**: Uses GPT-4o for intelligent responses
- **PDF Support**: Upload PDFs and ask questions about their content
- **Hardcoded Answers**: Fast responses for common questions
- **CORS Enabled**: Ready for frontend on localhost:5173

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required for chatbot)

## Troubleshooting

**"OPENAI_API_KEY not found" warning:**
- Make sure you created a `.env` file in the `backend/` directory
- Check that your API key is correct
- Restart the server after adding the key

**PDF upload fails:**
- Ensure the PDF contains extractable text (not scanned images)
- Check file size - very large PDFs may hit memory limits

**Chatbot returns errors:**
- Verify your OpenAI API key is valid and has credits
- Check your internet connection
- Review the error message returned by the API
