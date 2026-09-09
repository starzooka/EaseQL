from pathlib import Path

from app.main import _clean_sql_response


assert _clean_sql_response("Here is the query:\n```sql\nSELECT * FROM uploaded_data;\n```") == "SELECT * FROM uploaded_data;"
assert _clean_sql_response("SQL: SELECT COUNT(*) FROM uploaded_data;") == "SELECT COUNT(*) FROM uploaded_data;"
assert _clean_sql_response("The answer is:\nWITH rows AS (SELECT 1) SELECT * FROM rows") == "WITH rows AS (SELECT 1) SELECT * FROM rows"

prompt_text = Path(__file__).resolve().parents[2] / "local-llm" / "prompts" / "text-to-sql.txt"
content = prompt_text.read_text(encoding="utf-8")
assert "CRITICAL SQL SYNTAX RULE" in content
assert "Subscription Date" in content
assert '"Subscription Date"' in content
print("SQL response cleanup checks passed")
