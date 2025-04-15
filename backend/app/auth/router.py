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
)
from app.auth.service import AuthService
from fastapi import APIRouter, Depends, Query, Response

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


@router.get("/verify", response_model=UserResponse)
async def verify_token(
        token: str = Query(..., description="Email verification token"),
        auth_service: AuthService = Depends(get_auth_service),
):
    """
    Verify a user's email with token

    This endpoint would be accessed via a link in the verification email
    """
    return await auth_service.verify_token(token)


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
        current_user_id: str = Depends(get_current_user_id),
        auth_service: AuthService = Depends(get_auth_service),
):
    """Get information about the currently logged in user"""
    return await auth_service.get_user_info(current_user_id)