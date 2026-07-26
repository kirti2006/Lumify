"""Tests for API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert data["service"] == "Lumify AI Microservice MS-2"


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test the root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Lumify AI Microservice MS-2"
    assert data["status"] == "running"


@pytest.mark.asyncio
async def test_generate_question_endpoint(
    client: AsyncClient,
    auth_headers: dict,
    sample_resume_summary: dict,
    sample_jd_summary: dict,
):
    """Test the generate question endpoint."""
    payload = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "interview_id": "test_interview_123",
        "resume_summary": sample_resume_summary,
        "jd_summary": sample_jd_summary,
        "question_type": "technical",
        "difficulty": "medium",
    }

    response = await client.post(
        "/api/v1/ai/generate-question",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


@pytest.mark.asyncio
async def test_evaluate_answer_endpoint(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test the evaluate answer endpoint."""
    payload = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "interview_id": "test_interview_123",
        "question": "Tell me about a time you handled a difficult situation.",
        "question_type": "behavioral",
        "difficulty": "medium",
        "answer": "I once had a conflict with a team member over project priorities...",
    }

    response = await client.post(
        "/api/v1/ai/evaluate-answer",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


@pytest.mark.asyncio
async def test_generate_feedback_endpoint(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test the generate feedback endpoint."""
    payload = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "interview_id": "test_interview_123",
        "all_questions": ["Q1: Tell me about yourself", "Q2: Why this role?"],
        "all_answers": ["I am a software engineer...", "I am passionate about..."],
        "all_evaluations": [],
        "skill_scores": {"Python": 8.5, "Communication": 7.0},
    }

    response = await client.post(
        "/api/v1/ai/generate-feedback",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


@pytest.mark.asyncio
async def test_recommend_resources_endpoint(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test the recommend resources endpoint."""
    payload = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "interview_id": "test_interview_123",
        "skill_gaps": ["AWS", "Docker", "System Design"],
        "preferred_format": ["video", "course"],
        "time_constraint_minutes": 120,
    }

    response = await client.post(
        "/api/v1/ai/recommend-resources",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data


@pytest.mark.asyncio
async def test_save_state_endpoint(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test the save state endpoint."""
    payload = {
        "session_id": "test_session_123",
        "user_id": "test_user_123",
        "interview_id": "test_interview_123",
        "resume_summary": {"skills": ["Python"]},
        "jd_summary": {"role": "Engineer"},
        "difficulty_level": "medium",
        "conversation_history": [],
        "previous_questions": [],
        "skill_scores": {},
    }

    response = await client.post(
        "/api/v1/ai/save-state",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


@pytest.mark.asyncio
async def test_get_state_endpoint(
    client: AsyncClient,
    auth_headers: dict,
):
    """Test the get state endpoint."""
    response = await client.get(
        "/api/v1/ai/state/test_session_123",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
