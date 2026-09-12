# Backend

FastAPI service for Query NLP.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; interactive docs are at `/docs`.
Set `JWT_SECRET_KEY` before starting the service. `JWT_ALGORITHM` defaults to `HS256` and `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to `60`.
Login and registration are rate-limited per client IP and route. `AUTH_RATE_LIMIT_MAX_REQUESTS` defaults to `10` requests per `AUTH_RATE_LIMIT_WINDOW_SECONDS` (default `60` seconds).

## Tests

Tests are kept in `backend/tests` and can be run from this directory:

```powershell
python -m tests.test_upload
python -m tests.test_generate_sql
python -m tests.test_generate_sql_endpoint
python -m tests.test_execute_sql
python -m tests.test_end_to_end
python -m pytest tests/test_rate_limiting.py
```

`test_end_to_end` mocks the Ollama request, uploads `tests/sample_sales.csv`, exercises `/api/query`, and checks that DuckDB executes the returned SQL successfully.

## Upload a data file

Send an authenticated `.csv` file to `POST /api/upload` as multipart field `file`:

```powershell
curl.exe -b cookies.txt -F "file=@file.csv" http://localhost:8000/api/upload
```

The response includes a unique per-user table name and the total row count. CSV files are stored in `data/query.duckdb`; the original filename is stored with the dataset metadata. Uploads are limited to 50 MB.

## Persistent chat messages

Chat message endpoints require authentication through the `access_token` cookie or a Bearer token. The session must belong to the authenticated user; otherwise the API returns `404`. Missing or invalid authentication returns `401`.

Create a message with `POST /api/chat/sessions/{session_id}/messages`:

```powershell
curl.exe -b cookies.txt -X POST http://localhost:8000/api/chat/sessions/1/messages `
	-H "Content-Type: application/json" `
	-d '{"role":"user","content":"Show the largest amount."}'
```

The request accepts only `role` and `content`. Supported roles are `user`, `assistant`, and `system`; `user_id` is assigned from the authenticated user and must not be sent by the client. A successful response has status `201` and returns the message `id`, `role`, `content`, and `created_at`. Adding a message updates the parent session's `updated_at` timestamp.

List messages with `GET /api/chat/sessions/{session_id}/messages`:

```powershell
curl.exe -b cookies.txt http://localhost:8000/api/chat/sessions/1/messages
```

Messages are returned in chronological order by creation time. The endpoint returns `404` when the session does not exist or belongs to another user.

## Generate SQL with Ollama

Send the generated schema block and a natural-language question to `POST /generate-sql`:

```powershell
curl.exe -b cookies.txt -X POST http://localhost:8000/generate-sql `
	-H "Content-Type: application/json" `
	-d '{"schema_text":"TABLE \"uploaded_data\" (\"amount\" DOUBLE);","question":"Show the largest amount."}'
```

The backend calls Ollama at `OLLAMA_CHAT_URL` (default `http://localhost:11434/v1/chat/completions`) using `OLLAMA_MODEL` (default `qwen2.5-coder:latest`). The response parser removes model-added SQL fences or preambles and returns `{ "sql": "..." }`.

## Execute generated SQL

Run a generated statement with `POST /execute-sql`:

```powershell
curl.exe -b cookies.txt -X POST http://localhost:8000/execute-sql `
	-H "Content-Type: application/json" `
	-d '{"sql":"SELECT * FROM uploaded_data ORDER BY amount DESC"}'
```

Execution uses a read-only DuckDB connection, permits only one `SELECT`, `WITH`, or `VALUES` statement, caps results at 500 rows, and interrupts queries after `DUCKDB_QUERY_TIMEOUT` (default `5s`). Uploaded tables are stored in `data/query.duckdb`; override the path with `DUCKDB_PATH`.
