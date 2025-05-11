(first run in ./backend dir)
uv run pybabel extract -o ./app/i18n/translations/messages.pot .

(this run in ./backend/app/i18n dir)
uv run pybabel init -i translations/messages.pot -d translations -l uk_UA

uv run pybabel compile -d translations