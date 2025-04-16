from typing import Any

from pydantic import BaseModel, ConfigDict


class BaseReturn(BaseModel):
    message: str
    data: Any | None = None

    model_config = ConfigDict(exclude_none=True)
