import gettext
import contextvars
from pathlib import Path
from fastapi import Request

# Store current language per request
_current_lang = contextvars.ContextVar("current_language", default="en")


def set_language(lang: str):
    _current_lang.set(lang)


def get_language() -> str:
    return _current_lang.get()


def get_translation(lang: str = None):
    lang = lang or get_language()
    locales_dir = Path(__file__).parent / "translations"
    return gettext.translation(
        "messages",
        localedir=locales_dir,
        languages=[lang],
        fallback=True,
    )


def _(message: str) -> str:
    translation = get_translation()
    return translation.gettext(message)


async def set_locale(request: Request):
    lang = (
        request.headers.get("X-User-Language")
        or request.headers.get("Accept-Language")
        or "en"
    )
    set_language(lang)
