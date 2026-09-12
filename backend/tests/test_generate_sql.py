from pathlib import Path

from app.services.sql_service import clean_sql_response


def test_clean_sql_response():
	assert clean_sql_response("Here is the query:\n```sql\nSELECT * FROM uploaded_data;\n```") == "SELECT * FROM uploaded_data;"
	assert clean_sql_response("SQL: SELECT COUNT(*) FROM uploaded_data;") == "SELECT COUNT(*) FROM uploaded_data;"
	assert clean_sql_response("The answer is:\nWITH rows AS (SELECT 1) SELECT * FROM rows") == "WITH rows AS (SELECT 1) SELECT * FROM rows"

def test_text_to_sql_prompt_contains_schema_rules():
	prompt_text = Path(__file__).resolve().parents[2] / "local-llm" / "prompts" / "text-to-sql.txt"
	content = prompt_text.read_text(encoding="utf-8")
	assert "CRITICAL SQL SYNTAX RULE" in content
	assert "Subscription Date" in content
	assert '"Subscription Date"' in content
