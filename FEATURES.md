# Office.io — Features & Usage

This document enumerates the technical and usage features contained in the Office.io repository, explains where key functionality lives, and provides instructions, caveats, and troubleshooting tips for running and testing the project locally.

---

## Project overview

Office.io is a small web application with a React + Vite frontend and a Flask-based backend. The project contains the following high-level capabilities:

- Frontend UI using React, Vite, Tailwind and MUI components, including a 3D scene built with Three.js / react-three-fiber.
- Backend REST API built with Flask that serves JSON-backed chat/conversation data, event scheduling endpoints, file upload & PDF processing functionality, and (optionally) ML-based QA using sentence-transformers & a T5 model.
- Local JSON data store used for example data and simple persistence during development (files under `backend/data/`).

---

## Repository layout (important files and directories)

- `package.json` (root): lightweight root package manifest (small dependencies listed).
- `frontend/` - React + Vite application
  - `frontend/package.json` - full frontend dependencies and npm scripts (dev/build/preview)
  - `frontend/src/` - React source code and components
  - `frontend/public/` - public static assets (images, fonts)
  - `frontend/src/components/3d/` - 3D components using react-three-fiber/Three.js
- `backend/` - Flask backend
  - `backend/app.py` - main Flask app and API routes
  - `backend/data/` - JSON data files used for conversations, messages, events, user (and a couple of example PDF assets)
- `README.md` - repository-level README
- `FEATURES.md` - this file


---

## Tech stack and third-party libs

Frontend
- React (v18+)
- Vite (dev server/build tooling)
- Tailwind CSS (via `tailwind.config.js` / `postcss.config.js`)
- MUI (Material UI) and Emotion for some components
- react-three-fiber and @react-three/drei for 3D scenes
- socket.io-client (present in `frontend/package.json`) — used for realtime features if enabled
- Firebase SDK (configured via `frontend/firebase.js`) — optional connectivity

Backend
- Flask + flask-cors for REST API and CORS handling
- sentence-transformers for dense-vector embeddings (embedding model: `multi-qa-mpnet-base-dot-v1`)
- transformers (Hugging Face) to load a generative QA model (`google/flan-t5-large` in `app.py`)
- PyMuPDF (`fitz`) to extract text from uploaded PDFs
- FAISS (Facebook AI Similarity Search) used as an in-memory vector index for chunk retrieval
- numpy for numerical arrays

Notes: SentenceTransformers and Transformers will download pretrained models on first use. FAISS does not always pip-install cleanly on Windows; conda is recommended for FAISS on Windows.

---

## Backend features (endpoints and behavior)

The main API is implemented in `backend/app.py`. Key endpoints and behaviors:

- `POST /login`
  - Expects JSON body with `username`.
  - Saves a simple user JSON object to `backend/data/user.json` and returns the saved object.

- `GET /user`
  - Returns the user JSON stored in `backend/data/user.json` (or an empty object if not present).

- `GET /conversations`
  - Returns all conversations loaded from `backend/data/conversations.json` as a list.

- `GET /conversations/<conversation_id>`
  - Returns a single conversation by ID.

- `GET /conversations/<conversation_id>/messages`
  - Returns messages for a conversation from `backend/data/messages.json`.

- `POST /conversations/<conversation_id>/messages`
  - Adds a message to the messages JSON on disk and returns the new message. Useful for testing chat flows.

- `GET /events` and `POST /events`
  - Simple calendar event CRUD: `POST /events` adds events and avoids duplicates by title/start/end.
  - Uses `backend/data/events.json` for persistence.

- `POST /upload_pdf`
  - Accepts a form file upload (`file` field). Extracts text using PyMuPDF and chunks the text. Generates embeddings for chunks using SentenceTransformer and builds a FAISS index for vector similarity search.
  - Returns success message once processed.

- `POST /ask_question`
  - Accepts JSON body with `question`.
  - If the question matches a hard-coded answer mapping (`hardcoded_answers` in `app.py`), returns that answer.
  - Otherwise, uses the embedding model to find the most relevant chunk via FAISS and passes a context-augmented prompt to the T5 QA model to generate an answer.

CORS configuration: The app sets permissive CORS and adds response headers in `after_request`. It specifically allows `http://localhost:5173`.

Data files used at runtime (sample locations)
- `backend/data/conversations.json`
- `backend/data/messages.json`
- `backend/data/user.json`
- `backend/data/events.json`
- Example PDFs: `backend/data/Onboarding.pdf`, `backend/data/SWE_Project.pdf`

---

## Frontend features (visuals, components, routes)

Major frontend areas (files are under `frontend/src`):
- Chat UI and messaging: `Messaging.jsx`, `ChatPanel.jsx`, `ChatPopup.jsx`, `MainChatPanel.jsx`, `chat.jsx` — these components implement the UI for listing conversations and sending/receiving messages.
- Authentication UI: `LogIn.jsx`, `LogInPage.jsx` — simple username-based login that calls `POST /login`.
- Scheduler UI: `Scheduler.jsx`, `SchedulePopup.jsx` — calendar/event UI; interacts with `/events` endpoints.
- 3D environment: `src/components/3d/*` — a set of reusable 3D subcomponents (Avatar, Lounge area, Office components, etc.) using react-three-fiber and Three.js. Adds a visually rich office scene.
- Utilities & small components: `ConversationList.jsx`, `BoardInteraction.jsx`, `PeopleInteraction.jsx`, `ResizablePanel.jsx`.
- CSS: Tailwind + local CSS files in `frontend/src/css/` for layout and branding.

Frontend script commands in `frontend/package.json`:
- `npm run dev` — launches Vite dev server (default port 5173)
- `npm run build` — build production assets
- `npm run preview` — preview built assets
- `npm run lint` — run eslint

Behavioral notes:
- The frontend expects the backend to be accessible at `http://localhost:5000` (standard Flask port) for development usage.
- Firebase configuration exists in `frontend/firebase.js` (no guarantee the project is connected to a live Firebase project; it's provided for optional integration).

---

## How to run (quick / full)

Quick (frontend-only smoke test):
1. Open PowerShell and run:

```powershell
cd 'C:\Users\Haame\OneDrive\Documents\CS\Office.io\frontend'
npm install
npm run dev
```

2. Open `http://localhost:5173` in your browser. This exercises the frontend UI. You may not have live backend features if the Flask backend isn't running.

Quick backend (lightweight test without heavy ML deps):
1. Create a Python venv and install Flask:

```powershell
cd 'C:\Users\Haame\OneDrive\Documents\CS\Office.io'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install flask flask-cors
python .\backend\app.py
```

2. Test endpoints from another shell:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/conversations -Method GET
Invoke-RestMethod -Uri http://localhost:5000/user -Method GET
```

Full (with embeddings & QA model) — recommended using `conda` on Windows for FAISS:

```powershell
# using conda (PowerShell)
conda create -n officeio python=3.10 -y
conda activate officeio
conda install -c conda-forge faiss-cpu -y
pip install flask flask-cors sentence-transformers transformers numpy pymupdf
python .\backend\app.py
```

- Note: On first startup, SentenceTransformer and Transformers will download models (hundreds of MBs to multiple GBs). Ensure enough disk space and a stable connection.

---

## Environment files and reproducible installs

You can create a minimal `requirements.txt` for pip users (but FAISS on Windows is not guaranteed via pip). Example `requirements.txt`:

```
flask
flask-cors
sentence-transformers
transformers
numpy
pymupdf
# faiss-cpu  # prefer conda installation for faiss-cpu on Windows
```

Conda `environment.yml` snippet (recommended on Windows):

```yaml
name: officeio
channels:
  - conda-forge
dependencies:
  - python=3.10
  - faiss-cpu
  - pip
  - pip:
    - flask
    - flask-cors
    - sentence-transformers
    - transformers
    - numpy
    - pymupdf
```

---

## Important caveats and troubleshooting

1. FAISS on Windows
   - `faiss-cpu` often fails to install via pip on Windows; use conda-forge: `conda install -c conda-forge faiss-cpu`.
   - Alternative: run backend in WSL (Ubuntu) or a Linux container.

2. Large model downloads & RAM
   - `google/flan-t5-large` and the embedding model will be downloaded by Hugging Face. `flan-t5-large` is large and memory-hungry; running it locally may require >8GB RAM (often more). Consider using a smaller model or a hosted model endpoint for production testing.

3. OneDrive interactions and VS Code freezes
   - If your workspace is under OneDrive, VS Code may stall while OneDrive synchronizes. Use Explorer to select the repo folder and pick "Always keep on this device" to ensure local copy.
   - Starting VS Code with `code --disable-extensions` can rule out extensions causing the freeze.

4. CORS or port mismatches
   - Backend sets CORS and explicitly adds a header for `http://localhost:5173`. If you run the frontend on a different host or change ports, update the backend CORS settings or the `after_request` origin header.

5. Disk usage
   - Model caching (Hugging Face) is stored in `~/.cache/huggingface/` by default and can use many GBs.

---

## Security & production notes

- This project persists data to local JSON files for demo purposes only. Do not use this as-is in production.
- No authentication or authorization is implemented besides a simple `POST /login` that writes a user JSON file. For production, integrate secure auth (OAuth2, session management, JWT, MFA as necessary) and protect sensitive endpoints.
- If you enable file upload endpoints, validate and sanitize files and enforce file size limits.

---

## Suggested improvements & next steps

- Add a `requirements.txt` and `environment.yml` file to make environment setup reproducible.
- Make the heavy ML imports lazy (import inside `/upload_pdf` and `/ask_question`) so the server can start without the heavy dependencies for UI testing.
- Add a lightweight stub mode (Env var) so the backend can fallback to non-ML behavior if FAISS/transformers aren't installed.
- Add unit tests for API endpoints and a small E2E test that runs the frontend build and hits critical endpoints.

---

## Quick tests you can run now

- Start frontend: `npm run dev` in `frontend/` and verify UI loads at `http://localhost:5173`.
- Start backend (basic): create venv and run `python backend/app.py` after installing Flask.
- Hit endpoints (PowerShell examples):

```powershell
Invoke-RestMethod -Uri http://localhost:5000/conversations -Method GET
Invoke-RestMethod -Uri http://localhost:5000/user -Method GET
```

---

## Contact and attribution

This summary was generated from the repository contents; see `backend/app.py` and `frontend/package.json` for authoritative implementation details and exact dependency versions.


---

End of FEATURES.md
