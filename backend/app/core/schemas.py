from typing import Any

from pydantic import BaseModel


class BaseReturn(BaseModel):
    message: str
    data: Any | None = None
