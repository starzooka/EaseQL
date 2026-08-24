from app.main import _clean_sql_response


assert _clean_sql_response("Here is the query:\n```sql\nSELECT * FROM uploaded_data;\n```") == "SELECT * FROM uploaded_data;"
assert _clean_sql_response("SQL: SELECT COUNT(*) FROM uploaded_data;") == "SELECT COUNT(*) FROM uploaded_data;"
assert _clean_sql_response("The answer is:\nWITH rows AS (SELECT 1) SELECT * FROM rows") == "WITH rows AS (SELECT 1) SELECT * FROM rows"
print("SQL response cleanup checks passed")
