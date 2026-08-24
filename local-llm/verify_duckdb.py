import duckdb

result = duckdb.sql("SELECT * FROM read_csv_auto('file.csv')")
print(result)
