from typing import TypeVar, Generic

from pydantic import BaseModel

T = TypeVar("T")


class BaseReturn(BaseModel, Generic[T]):
    message: str
    data: T | None = None
