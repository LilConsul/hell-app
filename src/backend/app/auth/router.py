from fastapi import APIRouter, Depends, Response

from app.auth.dependencies import (
    get_auth_service,
    get_current_user_id,
    get_user_repository,
)
from app.auth.repository import UserRepository
from app.auth.schemas import (
    AuthReturn,
    EmailRequest,
    MFASetupResponse,
    MFAVerify,
    Token,
    UserCreate,
    UserLogin,
    UserResetPassword,
)
from app.auth.service import AuthService
from app.core.exceptions import NotFoundError
from app.i18n import _

router = APIRouter(tags=["auth"], prefix="/auth")


# Authentication endpoints
@router.post("/register", response_model=AuthReturn, response_model_exclude_none=True)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user and send verification email"""
    await auth_service.register(user_data)
    return {"message": _("User registered successfully. Please verify your email.")}


@router.post("/login", response_model=AuthReturn, response_model_exclude_none=True)
async def login(
    response: Response,
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login and get access token"""
    user = await auth_service.login(login_data, response)
    return {"message": _("Login successful"), "data": user}


@router.post("/logout", response_model=AuthReturn, response_model_exclude_none=True)
async def logout(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Logout and clear cookies"""
    await auth_service.logout(response)
    return {"message": _("Logout successful")}


@router.post("/verify", response_model=AuthReturn, response_model_exclude_none=True)
async def verify_token(
    token: Token,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Verify a user's email with token
    """
    await auth_service.verify_token(token.token)
    return {"message": _("Email verified successfully")}


@router.post(
    "/send-password-reset", response_model=AuthReturn, response_model_exclude_none=True
)
async def send_password_reset_token(
    email_request: EmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Send password reset token to user email
    """
    await auth_service.send_password_reset_token(email_request.email)
    return {"message": _("Password reset email sent. Please check your inbox.")}


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
    return {"message": _("Password reset successfully")}


@router.post("/mobile/login", response_model=Token, response_model_exclude_none=True)
async def mobile_login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login for mobile clients and get access token directly in response body instead of a cookie"""
    token_data = await auth_service.mobile_login(login_data)
    return token_data


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    user_id: str = Depends(get_current_user_id),
    user_repository: UserRepository = Depends(get_user_repository),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Setup MFA for the current user"""
    user = await user_repository.get_by_id(user_id)
    if not user:
        raise NotFoundError(_("User not found"))
    return await auth_service.setup_mfa(user)


@router.post("/mfa/verify", response_model=AuthReturn)
async def verify_mfa_setup(
    mfa_verify: MFAVerify,
    user_id: str = Depends(get_current_user_id),
    user_repository: UserRepository = Depends(get_user_repository),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Verify and enable MFA setup"""
    user = await user_repository.get_by_id(user_id)
    if not user:
        raise NotFoundError(_("User not found"))
    await auth_service.verify_mfa_setup(user, mfa_verify.code)
    return {"message": _("MFA enabled successfully")}


@router.post("/mfa/disable", response_model=AuthReturn)
async def disable_mfa(
    mfa_verify: MFAVerify,
    user_id: str = Depends(get_current_user_id),
    user_repository: UserRepository = Depends(get_user_repository),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Disable MFA for the current user"""
    user = await user_repository.get_by_id(user_id)
    if not user:
        raise NotFoundError(_("User not found"))
    await auth_service.disable_mfa(user, mfa_verify.code)
    return {"message": _("MFA disabled successfully")}
