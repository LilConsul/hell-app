from typing import Callable

import pytz
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware


class TimezoneMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: FastAPI,
        default_timezone: str = "UTC",
    ):
        super().__init__(app)
        self.default_timezone = default_timezone

    async def dispatch(self, request: Request, call_next: Callable):
        timezone_name = request.headers.get("X-Timezone", self.default_timezone)

        # Validate timezone
        try:
            timezone = pytz.timezone(timezone_name)
        except pytz.exceptions.UnknownTimeZoneError:
            timezone = pytz.timezone(self.default_timezone)

        request.state.timezone = timezone
        request.state.timezone_name = (
            timezone_name
            if timezone_name != self.default_timezone
            else self.default_timezone
        )

        response = await call_next(request)

        # Return timezone info in response for debugging (optional)
        response.headers["X-Server-Timezone"] = str(timezone)

        return response
