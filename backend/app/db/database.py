import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()  # reads a .env file in your project root (pip install python-dotenv)

# Never hardcode credentials in source. Put this in a .env file instead:
#   DATABASE_URL=postgresql://postgres:Abubakar123%40@localhost:5433/postgres
# ...and add ".env" to your .gitignore so it never gets committed.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/postgres",  # local fallback only
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # avoids "SSL connection has been closed unexpectedly" after the
                         # Docker container idles or restarts — cheap insurance, costs nothing
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()