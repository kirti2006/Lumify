"""Main LangGraph workflow for interview processing."""

from typing import Any, Dict

from langgraph.graph import END, StateGraph

from config.logging import get_logger
from graph.interview_state import InterviewState
from graph.nodes import (
    answer_evaluator_node,
    difficulty_selector_node,
    feedback_generator_node,
    gap_analyzer_node,
    jd_analyzer_node,
    learning_resource_agent_node,
    question_generator_node,
    resume_analyzer_node,
    state_saver_node,
)
from llm.llm_client import LLMClient

logger = get_logger(__name__)


class InterviewWorkflow:
    """LangGraph workflow for interview processing."""

    def __init__(
        self,
        llm_client: LLMClient,
        session_id: str,
        user_id: str,
        interview_id: str,
    ):
        self.llm_client = llm_client
        self.session_id = session_id
        self.user_id = user_id
        self.interview_id = interview_id

    def _create_graph(self) -> StateGraph:
        """Create the LangGraph state machine."""
        graph = StateGraph(InterviewState)

        graph.add_node("resume_analyzer", self._wrap_resume_analyzer)
        graph.add_node("jd_analyzer", self._wrap_jd_analyzer)
        graph.add_node("gap_analyzer", self._wrap_gap_analyzer)
        graph.add_node("difficulty_selector", self._wrap_difficulty_selector)
        graph.add_node("question_generator", self._wrap_question_generator)
        graph.add_node("answer_evaluator", self._wrap_answer_evaluator)
        graph.add_node("feedback_generator", self._wrap_feedback_generator)
        graph.add_node("learning_resource_agent", self._wrap_learning_resource_agent)
        graph.add_node("state_saver", self._wrap_state_saver)

        graph.set_entry_point("resume_analyzer")

        graph.add_edge("resume_analyzer", "jd_analyzer")
        graph.add_edge("jd_analyzer", "gap_analyzer")
        graph.add_edge("gap_analyzer", "difficulty_selector")
        graph.add_edge("difficulty_selector", "question_generator")
        graph.add_edge("question_generator", "answer_evaluator")
        graph.add_edge("answer_evaluator", "feedback_generator")
        graph.add_edge("feedback_generator", "learning_resource_agent")
        graph.add_edge("learning_resource_agent", "state_saver")
        graph.add_edge("state_saver", END)

        return graph

    async def _wrap_resume_analyzer(self, state: InterviewState) -> Dict[str, Any]:
        return await resume_analyzer_node(state, self.llm_client)

    async def _wrap_jd_analyzer(self, state: InterviewState) -> Dict[str, Any]:
        return await jd_analyzer_node(state, self.llm_client)

    async def _wrap_gap_analyzer(self, state: InterviewState) -> Dict[str, Any]:
        return await gap_analyzer_node(state, self.llm_client)

    async def _wrap_difficulty_selector(self, state: InterviewState) -> Dict[str, Any]:
        return await difficulty_selector_node(state, self.llm_client)

    async def _wrap_question_generator(self, state: InterviewState) -> Dict[str, Any]:
        return await question_generator_node(state, self.llm_client)

    async def _wrap_answer_evaluator(self, state: InterviewState) -> Dict[str, Any]:
        return await answer_evaluator_node(state, self.llm_client)

    async def _wrap_feedback_generator(self, state: InterviewState) -> Dict[str, Any]:
        return await feedback_generator_node(state, self.llm_client)

    async def _wrap_learning_resource_agent(self, state: InterviewState) -> Dict[str, Any]:
        return await learning_resource_agent_node(state, self.llm_client)

    async def _wrap_state_saver(self, state: InterviewState) -> Dict[str, Any]:
        return await state_saver_node(state)

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the full interview workflow."""
        initial_state = InterviewState(
            session_id=self.session_id,
            user_id=self.user_id,
            interview_id=self.interview_id,
            jd_summary=input_data.get("jd_summary", {}),
            question_type=input_data.get("question_type"),
            difficulty_level=input_data.get("difficulty", "medium"),
            previous_questions=input_data.get("previous_questions", []),
            conversation_history=input_data.get("conversation_history", []),
        )

        graph = self._create_graph()
        compiled_graph = graph.compile()

        result = await compiled_graph.ainvoke(initial_state)

        role = result.get("role_title") or input_data.get("jd_summary", {}).get("role_title") or "the position"
        default_q = f"Welcome! To start, tell me about yourself and your experience, particularly focusing on your background for {role}."

        return {
            "question": result.get("current_question") or default_q,
            "question_type": result.get("current_question_type") or input_data.get("question_type") or "behavioral",
            "difficulty": result.get("difficulty_level") or input_data.get("difficulty") or "medium",
            "expected_skills": (result.get("missing_skills") or [])[:3],
            "token_usage": result.get("token_usage") or {},
        }

    async def evaluate_answer(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run only the answer evaluation workflow."""
        conversation_history = input_data.get("conversation_history", [])
        conversation_history.append({"type": "answer", "content": input_data.get("answer", "")})

        initial_state = InterviewState(
            session_id=self.session_id,
            user_id=self.user_id,
            interview_id=self.interview_id,
            current_question=input_data.get("question", ""),
            current_question_type=input_data.get("question_type", "behavioral"),
            difficulty_level=input_data.get("difficulty", "medium"),
            conversation_history=conversation_history,
            skill_scores={},
        )

        result = await answer_evaluator_node(initial_state, self.llm_client)

        return {
            **(result.get("evaluation") or {}),
            "token_usage": result.get("token_usage", {}),
        }

    async def generate_feedback(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive feedback."""
        skill_scores = input_data.get("skill_scores", {})

        initial_state = InterviewState(
            session_id=self.session_id,
            user_id=self.user_id,
            interview_id=self.interview_id,
            previous_questions=input_data.get("all_questions", []),
            conversation_history=[
                {"type": "answer", "content": ans}
                for ans in input_data.get("all_answers", [])
            ],
            skill_scores=skill_scores,
            missing_skills=list(skill_scores.keys()),
            difficulty_level="medium",
            role_title=input_data.get("role", "Target Role"),
        )

        result = await feedback_generator_node(initial_state, self.llm_client)

        return {
            **(result.get("feedback") or {}),
            "token_usage": result.get("token_usage", {}),
        }

    async def recommend_resources(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend learning resources."""
        initial_state = InterviewState(
            session_id=self.session_id,
            user_id=self.user_id,
            interview_id=self.interview_id,
            missing_skills=input_data.get("skill_gaps", []),
            skill_scores=input_data.get("current_levels", {}),
            difficulty_level=input_data.get("difficulty_preference", "medium"),
        )

        result = await learning_resource_agent_node(initial_state, self.llm_client)

        return {
            "resources": result.get("learning_resources") or [],
            "token_usage": result.get("token_usage", {}),
        }
