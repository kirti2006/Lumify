"""AI-related Pydantic schemas for request and response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GenerateQuestionRequest(BaseModel):
    """Request schema for generating interview questions."""

    session_id: str = Field(..., min_length=1, max_length=255, description="Unique session identifier")
    user_id: str = Field(..., min_length=1, max_length=255, description="User identifier")
    interview_id: str = Field(..., min_length=1, max_length=255, description="Interview identifier")
    jd_summary: dict = Field(..., description="Job description summary with required skills, role, company")
    question_type: Optional[str] = Field(
        default=None,
        description="Type of question: behavioral, technical, coding, situational",
    )
    difficulty: Optional[str] = Field(
        default=None,
        description="Difficulty level: easy, medium, hard",
    )
    previous_questions: Optional[list[str]] = Field(
        default_factory=list,
        description="List of previously asked questions to avoid",
    )
    conversation_history: Optional[list[dict]] = Field(
        default_factory=list,
        description="Previous conversation history for follow-up questions",
    )
    count: Optional[int] = Field(
        default=5,
        description="Number of questions to generate",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_123",
                "interview_id": "int_456",
                "jd_summary": {
                    "required_skills": ["Python", "AWS", "Docker"],
                    "role": "Senior Backend Engineer",
                    "company": "TechCorp",
                },
                "question_type": "technical",
                "difficulty": "medium",
            }
        }


class QuestionData(BaseModel):
    """Generated question data."""

    question: str = Field(..., description="The generated interview question")
    question_type: str = Field(..., description="Type of question")
    difficulty: str = Field(..., description="Difficulty level")
    expected_skills: list[str] = Field(default_factory=list, description="Skills being tested")
    tips: Optional[list[str]] = Field(default=None, description="Tips for answering")


class GenerateQuestionResponse(BaseModel):
    """Response schema for generating interview questions."""

    session_id: str = Field(..., description="Unique session identifier")
    question: QuestionData = Field(..., description="Generated question data")
    follow_up_prompt: Optional[str] = Field(None, description="Suggested follow-up prompt")
    token_usage: dict = Field(default_factory=dict, description="Token usage statistics")


class GenerateQuestionsResponse(BaseModel):
    """Response schema for batch generating interview questions."""

    session_id: str = Field(..., description="Unique session identifier")
    questions: list[QuestionData] = Field(..., description="Generated questions data")
    token_usage: dict = Field(default_factory=dict, description="Token usage statistics")


class EvaluateAnswerRequest(BaseModel):
    """Request schema for evaluating an answer."""

    session_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    interview_id: str = Field(..., min_length=1, max_length=255)
    question: str = Field(..., description="The question that was asked")
    question_type: str = Field(..., description="Type of question")
    difficulty: str = Field(..., description="Difficulty level")
    answer: str = Field(..., min_length=1, description="The candidate's answer")
    conversation_history: Optional[list[dict]] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_123",
                "interview_id": "int_456",
                "question": "Tell me about a time you handled a difficult situation.",
                "question_type": "behavioral",
                "difficulty": "medium",
                "answer": "I once had a deadline conflict where...",
            }
        }


class EvaluationScores(BaseModel):
    """Individual evaluation scores."""

    correctness: float = Field(..., ge=0.0, le=5.0)
    communication: float = Field(..., ge=0.0, le=5.0)
    confidence: float = Field(..., ge=0.0, le=5.0)
    technical_accuracy: float = Field(..., ge=0.0, le=5.0)
    star_format: float = Field(..., ge=0.0, le=5.0)
    depth: float = Field(..., ge=0.0, le=5.0)
    overall: float = Field(..., ge=0.0, le=5.0)


class EvaluationData(BaseModel):
    """Full evaluation data."""

    scores: EvaluationScores
    strengths: list[str]
    weaknesses: list[str]
    improvement_suggestions: list[str]
    emotion_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    follow_up_question: Optional[str] = Field(default=None)


class EvaluateAnswerResponse(BaseModel):
    """Response schema for answer evaluation."""

    session_id: str
    evaluation: EvaluationData
    token_usage: dict


class GenerateFeedbackRequest(BaseModel):
    """Request schema for generating comprehensive feedback."""

    session_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    interview_id: str = Field(..., min_length=1, max_length=255)
    all_questions: list[str] = Field(..., description="All questions asked in the interview")
    all_answers: list[str] = Field(..., description="All answers provided")
    all_evaluations: list[dict] = Field(default_factory=list, description="All evaluations")
    skill_scores: Optional[dict[str, float]] = Field(
        default_factory=dict,
        description="Skill scores from the interview",
    )
    role: Optional[str] = Field(default=None, description="Target role")

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_123",
                "interview_id": "int_456",
                "all_questions": ["Question 1", "Question 2"],
                "all_answers": ["Answer 1", "Answer 2"],
                "all_evaluations": [],
                "skill_scores": {"Python": 8.5, "Communication": 7.0},
            }
        }


class OverallFeedback(BaseModel):
    """Overall interview feedback."""

    performance_summary: str
    overall_score: float
    strong_areas: list[str]
    areas_for_improvement: list[str]
    key_strengths: list[str]
    prioritized_improvements: list[dict]
    next_steps: list[str]
    estimated_preparation_time: Optional[str] = Field(default=None)


class GenerateFeedbackResponse(BaseModel):
    """Response schema for feedback generation."""

    session_id: str
    feedback: OverallFeedback
    token_usage: dict


class RecommendResourcesRequest(BaseModel):
    """Request schema for recommending learning resources."""

    session_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    interview_id: str = Field(..., min_length=1, max_length=255)
    skill_gaps: list[str] = Field(..., description="Skills that need improvement")
    current_level: Optional[dict[str, str]] = Field(
        default_factory=dict,
        description="Current skill levels",
    )
    preferred_format: Optional[list[str]] = Field(
        default=None,
        description="Preferred resource formats: video, article, course, documentation, practice",
    )
    time_constraint_minutes: Optional[int] = Field(
        default=None,
        description="Maximum time available for learning",
    )
    difficulty_preference: Optional[str] = Field(
        default=None,
        description="Difficulty preference: beginner, intermediate, advanced",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_123",
                "interview_id": "int_456",
                "skill_gaps": ["AWS", "Docker", "System Design"],
                "preferred_format": ["video", "course"],
                "time_constraint_minutes": 120,
            }
        }


class ResourceItem(BaseModel):
    """Individual learning resource."""

    title: str
    description: Optional[str] = None
    url: str
    type: str
    skill: str
    difficulty: str
    provider: Optional[str] = None
    duration_minutes: Optional[int] = None
    is_free: bool = True
    relevance_score: float = Field(ge=0.0, le=1.0)


class RecommendResourcesResponse(BaseModel):
    """Response schema for resource recommendations."""

    session_id: str
    resources: list[ResourceItem]
    total_count: int
    token_usage: dict


class SaveStateRequest(BaseModel):
    """Request schema for saving interview state."""

    session_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    interview_id: str = Field(..., min_length=1, max_length=255)

    jd_summary: Optional[dict] = Field(default=None)

    current_question: Optional[str] = None
    current_question_type: Optional[str] = None
    difficulty_level: Optional[str] = None

    conversation_history: Optional[list[dict]] = Field(default_factory=list)
    previous_questions: Optional[list[str]] = Field(default_factory=list)
    skill_scores: Optional[dict[str, float]] = Field(default_factory=dict)

    evaluation_summary: Optional[dict] = None
    feedback_summary: Optional[dict] = None
    emotion_score: Optional[float] = None

    metadata: Optional[dict] = None


class SaveStateResponse(BaseModel):
    """Response schema for saving state."""

    session_id: str
    saved: bool
    timestamp: datetime
    message: str


class GetStateResponse(BaseModel):
    """Response schema for retrieving interview state."""

    session_id: str
    user_id: str
    interview_id: str

    jd_summary: dict

    current_question: Optional[str]
    current_question_type: Optional[str]
    difficulty_level: str

    conversation_history: list[dict]
    previous_questions: list[str]
    skill_scores: dict[str, float]

    total_questions: int
    total_evaluations: int

    current_state: str
    last_activity_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess_abc123",
                "user_id": "user_123",
                "interview_id": "int_456",
                "jd_summary": {},
                "current_question": None,
                "conversation_history": [],
                "previous_questions": [],
                "skill_scores": {},
                "total_questions": 0,
                "total_evaluations": 0,
                "current_state": "initialized",
                "last_activity_at": "2024-01-01T00:00:00Z",
            }
        }
