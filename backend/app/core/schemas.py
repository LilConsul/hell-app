from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class BaseReturn(BaseModel, Generic[T]):
    message: str
    data: T | None = None
