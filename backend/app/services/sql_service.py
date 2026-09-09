import json
import os
import re
import threading
from pathlib import Path

import duckdb
import httpx
from fastapi import HTTPException

DATABASE_PATH = Path(os.getenv("DUCKDB_PATH", Path(__file__).resolve().parents[2] / "data" / "query.duckdb"))
OLLAMA_CHAT_URL = os.getenv("OLLAMA_CHAT_URL", "http://localhost:11434/v1/chat/completions")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:latest")
TEXT_TO_SQL_PROMPT_PATH = Path(__file__).resolve().parents[3] / "local-llm" / "prompts" / "text-to-sql.txt"
QUERY_TIMEOUT = os.getenv("DUCKDB_QUERY_TIMEOUT", "5s")
MAX_QUERY_ROWS = 500
FORBIDDEN_SQL_KEYWORDS = {
    "ATTACH", "DETACH", "COPY", "CREATE", "DROP", "ALTER", "DELETE", "UPDATE",
    "INSERT", "MERGE", "PRAGMA", "INSTALL", "LOAD", "CALL", "SET",
}
SQL_SYSTEM_PROMPT = """You generate safe, valid SQL for DuckDB.
Use only the tables and columns in the supplied schema. Never invent schema elements.
Return exactly one SQL statement and nothing else. Do not include explanations, comments,
labels, JSON, or markdown fences. Do not execute destructive statements such as DROP,
DELETE, UPDATE, INSERT, or ALTER. Prefer a LIMIT 100 for unbounded result lists.
"""


def quoted_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def sql_path(path: Path) -> str:
    return str(path).replace("'", "''")


def clean_sql_response(raw_text: str) -> str:
    text = raw_text.strip()
    fenced_match = re.search(r"```(?:sql)?\s*(.*?)```", text, flags=re.IGNORECASE | re.DOTALL)
    if fenced_match:
        text = fenced_match.group(1).strip()
    text = re.sub(r"^SQL\s*:\s*", "", text, flags=re.IGNORECASE)
    statement_start = re.search(r"\b(?:SELECT|WITH|VALUES)\b", text, flags=re.IGNORECASE)
    if statement_start:
        text = text[statement_start.start():]
    text = re.sub(r"```\s*$", "", text).strip()
    if not text:
        raise ValueError("Ollama returned an empty SQL response")
    return text


def format_text_to_sql_prompt(schema_context: str, question: str) -> str:
    prompt_template = TEXT_TO_SQL_PROMPT_PATH.read_text(encoding="utf-8")
    return (
        prompt_template
        .replace("{{schema_text}}", schema_context)
        .replace("{{sample_data}}", "")
        .replace("{{question}}", question)
    )


def _validate_sql(statement: str) -> str:
    statement = statement.strip()
    if statement.endswith(";"):
        statement = statement[:-1].rstrip()
    if ";" in statement or not re.match(r"^(SELECT|WITH|VALUES)\b", statement, flags=re.IGNORECASE):
        raise ValueError("Only one SELECT, WITH, or VALUES statement is allowed")
    keywords = {
        match.group(0).upper()
        for match in re.finditer(r"\b[A-Z]+\b", statement, flags=re.IGNORECASE)
    }
    rejected = sorted(keywords & FORBIDDEN_SQL_KEYWORDS)
    if rejected:
        raise ValueError(f"Forbidden SQL keyword: {rejected[0]}")
    return statement


def execute_read_only_query(sql: str) -> dict:
    statement = _validate_sql(sql)
    connection = duckdb.connect(str(DATABASE_PATH), read_only=True)
    timeout_match = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s|m)", QUERY_TIMEOUT.strip().lower())
    if not timeout_match:
        connection.close()
        raise ValueError("DUCKDB_QUERY_TIMEOUT must use a duration such as 500ms, 5s, or 1m")
    timeout_value, timeout_unit = timeout_match.groups()
    timeout_seconds = float(timeout_value) * {"ms": 0.001, "s": 1, "m": 60}[timeout_unit]
    interrupt_timer = threading.Timer(timeout_seconds, connection.interrupt)
    interrupt_timer.daemon = True
    interrupt_timer.start()
    try:
        result = connection.sql(f"SELECT * FROM ({statement}) AS limited_query LIMIT {MAX_QUERY_ROWS}")
        columns = [column[0] for column in result.description]
        rows = [dict(zip(columns, row)) for row in result.fetchall()]
        return {
            "sql": statement,
            "columns": columns,
            "row_count": len(rows),
            "capped_at": MAX_QUERY_ROWS,
            "rows": rows,
        }
    finally:
        interrupt_timer.cancel()
        connection.close()


async def generate_sql(
    schema_text: str,
    question: str,
    memory_context: str | None = None,
    conversation_context: str | None = None,
) -> str:
    user_prompt = f"SCHEMA:\n{schema_text}\n\nQUESTION:\n{question}"
    if memory_context:
        user_prompt = f"{user_prompt}\n\n{memory_context}"
    if conversation_context:
        user_prompt = f"{user_prompt}\n\n{conversation_context}"
    payload = {
        "model": OLLAMA_MODEL,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SQL_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(OLLAMA_CHAT_URL, json=payload)
            response.raise_for_status()
            raw_text = response.json()["choices"][0]["message"]["content"]
            return clean_sql_response(raw_text)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as error:
        raise HTTPException(status_code=502, detail=f"Could not generate SQL from Ollama: {error}") from error


def get_schema_context(table_name: str) -> str:
    if not table_name or not table_name.strip():
        raise ValueError("table_name must not be empty")

    quoted_table = quoted_identifier(table_name.strip())
    with duckdb.connect(str(DATABASE_PATH), read_only=True) as connection:
        columns = connection.sql(f"DESCRIBE {quoted_table}").fetchall()
        sample_result = connection.sql(f"SELECT * FROM {quoted_table} LIMIT 3")
        sample_columns = [column[0] for column in sample_result.description]
        sample_rows = [
            json.dumps(dict(zip(sample_columns, row)), default=str, separators=(",", ":"))
            for row in sample_result.fetchall()
        ]

    column_lines = "\n".join(
        f"- {quoted_identifier(name)}: {data_type}" for name, data_type, *_ in columns
    ) or "- (no columns)"
    sample_text = "\n".join(f"- {row}" for row in sample_rows) or "- (no rows)"
    return (
        f"TABLE: {quoted_table}\n"
        f"COLUMNS:\n{column_lines}\n"
        f"SAMPLE ROWS (up to 3):\n{sample_text}\n"
        "COLUMN HINTS:\n"
        "- Period: Represents Year and Quarter as a float (e.g., 2011.06). To group by year, use FLOOR(Period).\n"
        '- Data_value: This is a generic value column. When a user asks for "jobs", "revenue", or a specific metric, '
        "you MUST filter using the Series_title_1 or Series_title_2 columns to isolate that metric.\n"
        "- Suppressed: Contains nulls or specific flags."
    )
