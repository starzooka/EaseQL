# Local LLM

Ollama configuration and prompts for local query planning.

## Create the model

From this directory:

```powershell
ollama create query-nlp -f Modelfile
ollama run query-nlp
```

The model name and prompt files are intentionally local defaults so they can be replaced as the query pipeline evolves.

## Prompt templates

`prompts/text-to-sql.txt` is a strict DuckDB SQL-generation template. Replace `{{schema_text}}` with the upload endpoint's generated schema block and `{{question}}` with the user's question before sending it to Ollama. The model is instructed to return only one SQL statement, without explanations or markdown fences.
