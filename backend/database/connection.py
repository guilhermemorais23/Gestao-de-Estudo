import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

database_url = os.getenv("DATABASE_URL", "sqlite:///./prospecta.db")

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
