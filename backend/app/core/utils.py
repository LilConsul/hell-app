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
