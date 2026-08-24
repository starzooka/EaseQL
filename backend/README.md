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

## Tests

Tests are kept in `backend/tests` and can be run from this directory:

```powershell
python -m tests.test_upload
python -m tests.test_generate_sql
python -m tests.test_generate_sql_endpoint
python -m tests.test_execute_sql
python -m tests.test_end_to_end
```

`test_end_to_end` mocks the Ollama request, uploads `tests/sample_sales.csv`, exercises `/api/query`, and checks that DuckDB executes the returned SQL successfully.

## Upload a data file

Send a `.csv` file to `POST /api/upload` as multipart field `file`:

```powershell
curl.exe -F "file=@file.csv" http://localhost:8000/api/upload
```

The response includes the table name derived from the CSV filename and its total row count. CSV files are stored in `data/query.duckdb`; for example, `sales-data.csv` is ingested into `sales_data`.

The legacy `POST /upload` route remains available with its expanded preview and schema response.

## Generate SQL with Ollama

Send the generated schema block and a natural-language question to `POST /generate-sql`:

```powershell
curl.exe -X POST http://localhost:8000/generate-sql `
	-H "Content-Type: application/json" `
	-d '{"schema_text":"TABLE \"uploaded_data\" (\"amount\" DOUBLE);","question":"Show the largest amount."}'
```

The backend calls Ollama at `OLLAMA_CHAT_URL` (default `http://localhost:11434/v1/chat/completions`) using `OLLAMA_MODEL` (default `qwen2.5-coder:latest`). The response parser removes model-added SQL fences or preambles and returns `{ "sql": "..." }`.

## Execute generated SQL

Run a generated statement with `POST /execute-sql`:

```powershell
curl.exe -X POST http://localhost:8000/execute-sql `
	-H "Content-Type: application/json" `
	-d '{"sql":"SELECT * FROM uploaded_data ORDER BY amount DESC"}'
```

Execution uses a read-only DuckDB connection, permits only one `SELECT`, `WITH`, or `VALUES` statement, caps results at 500 rows, and interrupts queries after `DUCKDB_QUERY_TIMEOUT` (default `5s`). Uploaded tables are stored in `data/query.duckdb`; override the path with `DUCKDB_PATH`.
