from graph.interview_state import InterviewState
from schemas.ai import GenerateQuestionRequest


def test_generate_question_request_does_not_require_resume_summary():
    request = GenerateQuestionRequest(
        session_id="sess_1",
        user_id="user_1",
        interview_id="interview_1",
        jd_summary={"role": "Backend Engineer"},
    )

    assert request.jd_summary == {"role": "Backend Engineer"}
    assert not hasattr(request, "resume_summary")


def test_interview_state_does_not_expose_resume_summary():
    state = InterviewState(session_id="sess_1", user_id="user_1", interview_id="interview_1")

    assert not hasattr(state, "resume_summary")
