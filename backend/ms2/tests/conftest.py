"""Test configuration and fixtures."""

import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from config.database import Base, get_db_session
from config.settings import get_settings
from main import app

settings = get_settings()

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/lumify_ai_test"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

test_async_session_factory = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session_factory() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers() -> dict:
    """Create mock auth headers for testing."""
    return {
        "Authorization": "Bearer test_token",
        "X-API-Key": "internal-api-key-change-in-production",
    }


@pytest.fixture
def sample_resume_summary() -> dict:
    """Sample resume summary for testing."""
    return {
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "AWS"],
        "experience_years": 5,
        "education": "Bachelor's in Computer Science",
        "projects": ["E-commerce platform", "ML pipeline"],
    }


@pytest.fixture
def sample_jd_summary() -> dict:
    """Sample job description summary for testing."""
    return {
        "required_skills": ["Python", "AWS", "Docker", "System Design"],
        "role": "Senior Backend Engineer",
        "company": "TechCorp",
    }
