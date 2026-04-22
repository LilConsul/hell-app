from fastapi import APIRouter, Depends, Response

from app.auth.dependencies import (
    get_auth_service,
    get_current_user_id,
)
from app.auth.schemas import (
    AuthReturn,
    EmailRequest,
    MFALoginChallenge,
    MFALoginVerify,
    MFASetupReturn,
    MFAVerify,
    MobileLoginReturn,
    Token,
    UserCreate,
    UserLogin,
    UserResetPassword,
)
from app.auth.service import AuthService
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
    login_result = await auth_service.login(login_data, response)

    if isinstance(login_result, MFALoginChallenge):
        return {
            "message": _("MFA verification required"),
            "data": login_result,
        }

    return {"message": _("Login successful"), "data": login_result}


@router.post("/login/mfa", response_model=AuthReturn, response_model_exclude_none=True)
async def login_mfa(
    response: Response,
    mfa_data: MFALoginVerify,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Complete login by verifying MFA code using the MFA challenge token."""
    user = await auth_service.complete_mfa_login(
        mfa_data.mfa_token, mfa_data.mfa_code, response
    )
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


@router.post(
    "/mobile/login", response_model=MobileLoginReturn, response_model_exclude_none=True
)
async def mobile_login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login for mobile clients and get access token directly in response body instead of a cookie"""
    login_result = await auth_service.mobile_login(login_data)
    return {"data": login_result}


@router.post(
    "/mobile/login/mfa",
    response_model=MobileLoginReturn,
    response_model_exclude_none=True,
)
async def mobile_login_mfa(
    mfa_data: MFALoginVerify,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Complete mobile login by verifying MFA code and returning token payload."""
    token_data = await auth_service.complete_mobile_mfa_login(
        mfa_data.mfa_token,
        mfa_data.mfa_code,
    )
    return {"data": token_data}


@router.post("/mfa/setup", response_model=MFASetupReturn)
async def setup_mfa(
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Setup MFA for the current user"""

    data = await auth_service.setup_mfa(user_id)
    return MFASetupReturn(data=data, message="MFA setup successfully")


@router.post("/mfa/verify", response_model=AuthReturn)
async def verify_mfa_setup(
    mfa_verify: MFAVerify,
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Verify and enable MFA setup"""
    await auth_service.verify_mfa_setup(user_id, mfa_verify.code)
    return {"message": _("MFA enabled successfully")}


@router.post("/mfa/disable", response_model=AuthReturn)
async def disable_mfa(
    mfa_verify: MFAVerify,
    user_id: str = Depends(get_current_user_id),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Disable MFA for the current user"""
    await auth_service.disable_mfa(user_id, mfa_verify.code)
    return {"message": _("MFA disabled successfully")}
