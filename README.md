# Query NLP

A local natural-language query application with three independently runnable areas:

- `backend`: FastAPI service on `http://localhost:8000`
- `frontend`: Next.js app on `http://localhost:3000`
- `local-llm`: Ollama `Modelfile` and reusable prompts

## Start locally

Run each area in its own terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```powershell
cd frontend
npm run dev
```

See each directory's README for its specific setup details.
