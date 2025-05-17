(first run in ./backend dir)
```uv run pybabel extract -o ./app/i18n/translations/messages.pot .```

(this run for the first time)
```uv run pybabel init -i ./app/i18n/translations/messages.pot -d ./app/i18n/translations -l uk_UA```

(next run this)
```uv run pybabel update -i ./app/i18n/translations/messages.pot -d ./app/i18n/translations -l uk_UA```

```uv run pybabel compile -d ./app/i18n/translations```