from typing import Optional

from app.auth.models import User


class UserRepository:
    @staticmethod
    async def create(
            email: str, hashed_password: str,
            first_name: Optional[str] = None, last_name: Optional[str] = None
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
        )
        await user.insert()
        return user

    @staticmethod
    async def get_by_id(user_id: str) -> Optional[User]:
        return await User.find_one(User.id == user_id)

    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        return await User.find_one(User.email == email)

    @staticmethod
    async def set_verified(user: User) -> User:
        user.is_verified = True
        await user.save()
        return user

    @staticmethod
    async def update_user(user: User) -> User:
        await user.save()
        return user
