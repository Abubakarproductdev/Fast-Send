from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# The @ is replaced with %40
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Abubakar123%40@localhost:5433/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()