from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Connects to localhost on port 5433 with your password
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:Abubakar123@@localhost:5433/postgres"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()