import pytz
from app.auth.models import User
from fastapi import Request


def make_username(user: User) -> str:
    """
    Generate a username from user object
    """
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"

    if user.first_name:
        return user.first_name

    if user.last_name:
        return user.last_name

    return user.email.split("@")[0]


# Helper function to convert time to user timezone
def convert_to_user_timezone(dt, timezone):
    """Convert a datetime to the user's timezone"""
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(timezone)


# Dependency to get timezone from request
def get_timezone(request: Request):
    return request.state.timezone
