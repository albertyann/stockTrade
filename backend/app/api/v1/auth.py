from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ...database import get_db
from ...schemas.user import UserCreate, UserResponse
from ...schemas.auth import Token
from ...crud.user import get_user_by_username, create_user, get_password_hash
from ...core.security import create_access_token
from datetime import timedelta
from ...core.config import settings

router = APIRouter()


def authenticate_user(db: Session, username: str, password: str):
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    
    user = get_user_by_username(db, username)
    if not user:
        return None
    truncated_password = password.encode("utf-8")[:72].decode("utf-8", "ignore")
    if not pwd_context.verify(truncated_password, user.password_hash):
        return None
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    from ...crud.user import get_user_by_email, create_user
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)
