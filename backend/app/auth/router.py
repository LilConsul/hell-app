from app.auth.dependencies import (
    get_auth_service,
    get_current_user_id,
    get_oauth_service,
)
from app.auth.schemas import (
    EmailRequest,
    OAuthRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
    UserUpdatePassword,
    UserResetPassword,
)
from app.auth.service import AuthService
from fastapi import APIRouter, Body, Depends, Response

router = APIRouter(tags=["auth"], prefix="/auth")


# Authentication endpoints
@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user"""
    return await auth_service.register(user_data)


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login and get access token"""
    return await auth_service.login(login_data, response)


@router.post("/logout")
async def logout(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Logout and clear cookies"""
    return await auth_service.logout(response)


# Email verification endpoints
@router.post("/send-verification")
async def send_verification_token(
    email_request: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Send verification token (will print to console)

    In a real application, this would send an email with a verification link
    """
    return await auth_service.send_verification_token(email_request.email)


@router.post("/verify", response_model=UserResponse)
async def verify_token(
    token: str = Body(..., description="Email verification token"),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Verify a user's email with token

    This endpoint would be accessed via a link in the verification email
    """
    return await auth_service.verify_token(token)


@router.post("/send-password-reset")
async def send_password_reset_token(
    email_request: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Send password reset token (will print to console)

    In a real application, this would send an email with a password reset link
    """
    return await auth_service.send_password_reset_token(email_request.email)


@router.post("/reset-password")
async def reset_password(
    data: UserResetPassword,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Reset password using the token

    This endpoint would be accessed via a link in the password reset email
    """
    return await auth_service.reset_password(data.token, data.password)


# OAuth endpoints
@router.post("/google", response_model=Token)
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
    return await oauth_service.google_login(oauth_data, response)


# User info endpoints
@router.get("/me", response_model=UserResponse)
async def get_user_info(
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get information about the currently logged in user"""
    return await auth_service.get_user_info(user_id)


@router.put("/me", response_model=UserResponse)
async def update_user_info(
    user_data: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Update information about the currently logged in user"""
    return await auth_service.update_user_info(user_id, user_data)


@router.delete("/me")
async def delete_user_info(
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Delete the currently logged in user"""
    return await auth_service.delete_user_info(user_id)


@router.put("/me/change-password", response_model=UserResponse)
async def change_password(
    password_data: UserUpdatePassword,
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Change the password of the currently logged in user"""
    return await auth_service.change_password(user_id, password_data.password, password_data.new_password)
