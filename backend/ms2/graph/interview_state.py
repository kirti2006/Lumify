"""Interview State definition for LangGraph."""

from typing import Optional

from pydantic import BaseModel, Field


class InterviewState(BaseModel):
    """State object for LangGraph interview workflow."""

    session_id: str = Field(default="", description="Unique session identifier")
    user_id: str = Field(default="", description="User identifier")
    interview_id: str = Field(default="", description="Interview identifier")

    jd_summary: dict = Field(default_factory=dict, description="Parsed job description")

    extracted_skills: list = Field(default_factory=list, description="Skills from resume")
    missing_skills: list = Field(default_factory=list, description="Skills gap")
    experience_years: Optional[int] = Field(default=None, description="Years of experience")
    education_level: Optional[str] = Field(default=None, description="Education level")
    projects: list = Field(default_factory=list, description="Projects from resume")

    role_title: Optional[str] = Field(default=None, description="Target role")
    company_name: Optional[str] = Field(default=None, description="Target company")
    required_skills: list = Field(default_factory=list, description="Required skills from JD")
    preferred_skills: list = Field(default_factory=list, description="Preferred skills")

    difficulty_level: Optional[str] = Field(default="medium", description="Selected difficulty")

    previous_questions: list = Field(default_factory=list, description="Previously asked questions")
    conversation_history: list = Field(default_factory=list, description="Full conversation history")

    skill_scores: dict = Field(default_factory=dict, description="Skill assessments")
    current_question: Optional[str] = Field(default=None, description="Current question")
    current_question_type: Optional[str] = Field(default=None, description="Question type")
    emotion_score: Optional[float] = Field(default=None, description="Detected emotion score")

    evaluation: Optional[dict] = Field(default=None, description="Current evaluation result")
    feedback: Optional[dict] = Field(default=None, description="Generated feedback")

    current_node: str = Field(default="start", description="Current node in workflow")
    error: Optional[str] = Field(default=None, description="Error message if any")

    prompt_tokens: int = Field(default=0, description="Total prompt tokens used")
    completion_tokens: int = Field(default=0, description="Total completion tokens used")
    total_tokens: int = Field(default=0, description="Total tokens used")

    token_usage: dict = Field(default_factory=dict, description="Detailed token usage by node")

    def __init__(self, **data):
        super().__init__(**data)
        self._init_counts()

    def _init_counts(self):
        if not hasattr(self, '_question_count'):
            object.__setattr__(self, '_question_count', 0)
        if not hasattr(self, '_evaluation_count'):
            object.__setattr__(self, '_evaluation_count', 0)

    @property
    def question_count(self) -> int:
        return self._question_count

    @question_count.setter
    def question_count(self, value: int):
        object.__setattr__(self, '_question_count', value)

    @property
    def evaluation_count(self) -> int:
        return self._evaluation_count

    @evaluation_count.setter
    def evaluation_count(self, value: int):
        object.__setattr__(self, '_evaluation_count', value)
