from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers.auth import router as auth_router
from .routers.chat import router as chat_router
from .routers.memory import router as memory_router
from .routers.query import router as query_router

app = FastAPI(title="Query NLP API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "query-nlp", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.on_event("startup")
async def startup() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(query_router)
