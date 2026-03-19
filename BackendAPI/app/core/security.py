from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..models.user_model import User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "faosdifh1o29ud0asidjasnofiuahsdf0afyh038fha")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login')

# this is the password hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# this function checks if the password the user just typed matches the has in the  DB
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# this function takes a plain password and turns it into a secure hash
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# this creates the Digital ID Card (JWT) that the mobile app saves
# the app sends this token with every request instead of the password
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()

    # set the expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # add expiration claim to the data
    to_encode.update({"exp": expire})

    # sign and encode the token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await User.get(user_id)
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(current_user = Depends(get_current_user)):

    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user
