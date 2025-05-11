import pytz
from fastapi import Request

from app.auth.models import User


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


def convert_to_user_timezone(dt, timezone):
    """Convert a datetime to the user's timezone"""
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(timezone)


def convert_user_timezone_to_utc(dt, timezone):
    """Convert a datetime from the user's timezone to UTC"""
    if dt.tzinfo is None:
        # Naive datetime - assume it's in user's timezone and localize
        dt = timezone.localize(dt)
    else:
        # Already has timezone - replace it with user's timezone
        # First convert to naive by removing timezone
        naive_dt = dt.replace(tzinfo=None)
        # Then localize to user's timezone
        dt = timezone.localize(naive_dt)
    # Convert to UTC
    return dt.astimezone(pytz.utc)


def get_timezone(request: Request):
    return request.state.timezone
