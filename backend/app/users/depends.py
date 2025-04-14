from typing import Annotated

from app.users.service import fastapi_users
from fastapi import Depends

from .models import User

CurrentActiveUser = Annotated[User, Depends(fastapi_users.current_user(active=True))]
