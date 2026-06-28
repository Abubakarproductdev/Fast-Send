"""Convenience runner for local development.

    python run.py

is equivalent to::

    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""

import uvicorn

from app.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )


if __name__ == "__main__":
    main()
