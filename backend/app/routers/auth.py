from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import ALGORITHM, COOKIE_NAME, SECRET_KEY, authenticate_user, create_access_token, get_password_hash, get_user_by_email
from ..database import get_db
from ..models import User
from ..password_validation import validate_password
from ..services.rate_limit import AUTH_RATE_LIMIT
from jose import jwt

from ..password_validation import validate_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
COOKIE_MAX_AGE_SECONDS = 60 * 60


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    message: str


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE_SECONDS,
        path="/",
    )


@router.get("/session")
async def auth_session(request: Request) -> dict[str, bool | str]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return {"authenticated": True, "email": email}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(AUTH_RATE_LIMIT),
) -> AuthResponse:
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    password_validation = validate_password(payload.password)

    if not password_validation.strong:
        raise HTTPException(
            status_code=400,
            detail=(
             "Password must be Strong: 8–15 characters and contain at least "
            "one uppercase, one lowercase, one numeric, and one special character."
        ),
    )
    if await get_user_by_email(db, email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=email, hashed_password=get_password_hash(payload.password))
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered") from error
    await db.refresh(user)
    _set_auth_cookie(response, create_access_token(subject=user.email))
    return AuthResponse(message="User registered successfully")


@router.post("/login", response_model=AuthResponse)
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(AUTH_RATE_LIMIT),
) -> AuthResponse:
    content_type = request.headers.get("content-type", "").lower()
    email = ""
    secret = ""
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        email = str(form_data.get("username") or form_data.get("email") or "").strip().lower()
        secret = str(form_data.get("password") or "")
    else:
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        if isinstance(payload, dict):
            email = str(payload.get("email") or payload.get("username") or "").strip().lower()
            secret = str(payload.get("password") or "")

    if not email or not secret:
        raise HTTPException(status_code=400, detail="Email/username and password are required")
    user = await authenticate_user(db, email, secret)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})

    _set_auth_cookie(response, create_access_token(subject=user.email))
    return AuthResponse(message="Logged in successfully")


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/", httponly=True, secure=False, samesite="lax")
    return {"message": "Logged out"}
