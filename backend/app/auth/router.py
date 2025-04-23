from fastapi import APIRouter, Depends, Response

from app.auth.dependencies import (
    get_auth_service,
    get_oauth_service,
)
from app.auth.schemas import (
    AuthReturn,
    EmailRequest,
    OAuthRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResetPassword
)
from app.auth.service import AuthService

router = APIRouter(tags=["auth"], prefix="/auth")


# Authentication endpoints
@router.post("/register", response_model=AuthReturn, response_model_exclude_none=True)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user"""
    await auth_service.register(user_data)
    return {"message": "User registered successfully. Please verify your email."}


@router.post("/login", response_model=AuthReturn, response_model_exclude_none=True)
async def login(
    response: Response,
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login and get access token"""
    user = await auth_service.login(login_data, response)
    return {"message": "Login successful", "data": user}


@router.post("/logout", response_model=AuthReturn, response_model_exclude_none=True)
async def logout(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Logout and clear cookies"""
    await auth_service.logout(response)
    return {"message": "Logout successful"}


# Email verification endpoints
@router.post(
    "/send-verification", response_model=AuthReturn, response_model_exclude_none=True
)
async def send_verification_token(
    email_request: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Send verification token (will print to console)

    In a real application, this would send an email with a verification link
    """
    await auth_service.send_verification_token(email_request.email)
    return {"message": "Verification email sent. Please check your inbox."}


@router.post("/verify", response_model=AuthReturn, response_model_exclude_none=True)
async def verify_token(
    token: Token,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Verify a user's email with token

    This endpoint would be accessed via a link in the verification email
    """
    await auth_service.verify_token(token.token)
    return {"message": "Email verified successfully"}


@router.post(
    "/send-password-reset", response_model=AuthReturn, response_model_exclude_none=True
)
async def send_password_reset_token(
    email_request: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Send password reset token (will print to console)

    In a real application, this would send an email with a password reset link
    """
    await auth_service.send_password_reset_token(email_request.email)
    return {"message": "Password reset email sent. Please check your inbox."}


@router.post(
    "/reset-password", response_model=AuthReturn, response_model_exclude_none=True
)
async def reset_password(
    data: UserResetPassword,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Reset password using the token

    This endpoint would be accessed via a link in the password reset email
    """
    await auth_service.reset_password(data.token, data.password)
    return {"message": "Password reset successfully"}


# OAuth endpoints
@router.post("/google", response_model=AuthReturn, response_model_exclude_none=True)
async def google_login(
    response: Response,
    oauth_data: OAuthRequest,
    oauth_service=Depends(get_oauth_service),
):
    """
    Process Google OAuth authentication

    This endpoint receives the authorization code from the frontend
    after the user authenticates with Google.
    """
    data = await oauth_service.google_login(oauth_data, response)
    return {"message": "Google login successful", "data": data}
