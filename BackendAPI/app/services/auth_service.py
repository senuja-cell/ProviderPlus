from fastapi import HTTPException, status
from ..models.user_model import User, UserRole
from ..schemas.auth_schemas import UserSignupRequest, TokenResponse
from ..core.security import get_password_hash, verify_password, create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_WEB_CLIENT_ID", "")


async def register_new_user(user_data: UserSignupRequest) -> TokenResponse:
    """
    handles the logic for signing up a new user
    """

    # 1. check for email
    existing_user = await User.find_one(User.email == user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    # do not allow admin accounts to be created
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be created publicly."
        )

    # hash the password
    hashed_pwd = get_password_hash(user_data.password)

    # create the user DB object
    new_user = User(
        email=user_data.email,
        password_hash=hashed_pwd,
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        role=user_data.role
    )

    # save to mongoDB
    await new_user.insert()

    # auto-login: create a token immediately so they don't have to log in again
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(new_user.id),
        role=new_user.role,
        user_name=new_user.full_name
    )


async def authenticate_user(email: str, password: str):
    """
    handles the logic for logging in
    """

    # 1. find user by email
    user = await User.find_one(User.email == email)
    if not user:
        return None

    # 2. check if account was created with Google
    if user.password_hash == "GOOGLE_AUTH":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google Sign-In. Please use Continue with Google button."
        )

    # 3. verify password by comparing with hash
    if not verify_password(password, user.password_hash):
        return None

    # 4. generate token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=str(user.id),
        role=user.role,
        user_name=user.full_name
    )


async def google_login(id_token_string: str) -> TokenResponse:
    """
    Verify google ID token and login/signup user

    1. verify token with google
    2. extract user info (email, name)
    3. check if user exists
    4. if exists, login
    5. if not, create a new account
    6. return a JWT token
    """

    try:
        idinfo = id_token.verify_oauth2_token(
            id_token_string,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_user_id = idinfo.get('sub')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google"
            )

        existing_user = await User.find_one(User.email == email)

        if existing_user:
            access_token = create_access_token(
                data={"sub": str(existing_user.id), "role": existing_user.role}
            )
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user_id=str(existing_user.id),
                role=existing_user.role,
                user_name=existing_user.full_name,
                is_new_user=False
            )

        else:
            new_user = User(
                email=email,
                password_hash="GOOGLE_AUTH",
                full_name=name or email.split('@')[0],
                phone_number=None,
                role=UserRole.CUSTOMER
            )

            await new_user.insert()

            access_token = create_access_token(
                data={"sub": str(new_user.id), "role": new_user.role}
            )

            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user_id=str(new_user.id),
                role=new_user.role,
                user_name=new_user.full_name,
                is_new_user=True
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid google token {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google authentication failed {str(e)}"
        )


async def get_user_profile(user: User) -> dict:
    """
    Returns the full profile of the current user
    """
    return {
        "user_id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "birthday": user.birthday,
        "gender": user.gender,
        "role": user.role,
    }


async def update_user_profile(user: User, update_data: dict) -> dict:
    """
    Updates only the fields that are provided
    """
    # Only update fields that are not None
    update_fields = {k: v for k, v in update_data.items() if v is not None}

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    # Update the user in MongoDB
    await user.update({"$set": update_fields})

    # Fetch updated user
    updated_user = await User.get(user.id)

    return {
        "user_id": str(updated_user.id),
        "full_name": updated_user.full_name,
        "email": updated_user.email,
        "phone_number": updated_user.phone_number,
        "birthday": updated_user.birthday,
        "gender": updated_user.gender,
        "role": updated_user.role,
    }