"""LangGraph nodes for the interview workflow."""

import json
import time
from typing import Any, Dict

from config.logging import get_logger
from graph.interview_state import InterviewState
from llm.llm_client import LLMClient

logger = get_logger(__name__)


import os


def _load_prompt(filename: str) -> str:
    """Load prompt template from file."""
    try:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        with open(os.path.join(base_dir, "prompts", filename), "r") as f:
            return f.read()
    except FileNotFoundError:
        return ""


async def resume_analyzer_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Analyze resume and extract structured information."""
    node_name = "ResumeAnalyzer"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("question_prompt.txt")
        prompt_parts = prompt_template.split("RESUME_ANALYZER_PROMPT")[1].split("JD_ANALYZER_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        formatted_prompt = prompt.format(resume_summary="{}")

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert resume analyst. Extract structured information from the resume.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "execution_time_ms": execution_time})

        return {
            "extracted_skills": result.get("skills", []),
            "experience_years": result.get("experience_years"),
            "education_level": result.get("education_level"),
            "projects": result.get("projects", []),
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def jd_analyzer_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Analyze job description and extract requirements."""
    node_name = "JDAnalyzer"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("question_prompt.txt")
        prompt_parts = prompt_template.split("JD_ANALYZER_PROMPT")[1].split("GAP_ANALYZER_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        formatted_prompt = prompt.format(jd_summary=json.dumps(state.jd_summary))

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert job description analyzer. Extract key requirements from the JD.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "execution_time_ms": execution_time})

        return {
            "role_title": result.get("role_title"),
            "company_name": result.get("company_name"),
            "required_skills": result.get("required_skills", []),
            "preferred_skills": result.get("preferred_skills", []),
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def gap_analyzer_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Analyze skill gaps between resume and JD."""
    node_name = "GapAnalyzer"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("question_prompt.txt")
        prompt_parts = prompt_template.split("GAP_ANALYZER_PROMPT")[1].split("DIFFICULTY_SELECTOR_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        formatted_prompt = prompt.format(resume_skills=json.dumps(state.extracted_skills), jd_required_skills=json.dumps(state.required_skills))

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert skills gap analyst. Identify missing and weak skills.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "missing_skills": result.get("missing_skills", [])})

        return {
            "missing_skills": result.get("missing_skills", []),
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def difficulty_selector_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Select appropriate difficulty level based on profile."""
    node_name = "DifficultySelector"
    start_time = time.time()

    try:
        if state.difficulty_level and state.difficulty_level in ["easy", "medium", "hard"]:
            return {"difficulty_level": state.difficulty_level, "current_node": node_name}

        prompt_template = _load_prompt("question_prompt.txt")
        prompt_parts = prompt_template.split("DIFFICULTY_SELECTOR_PROMPT")[1].split("QUESTION_GENERATOR_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        candidate_profile = {"experience_years": state.experience_years, "skills": state.extracted_skills, "education": state.education_level}
        job_requirements = {"role": state.role_title, "required_skills": state.required_skills}

        formatted_prompt = prompt.format(candidate_profile=json.dumps(candidate_profile), job_requirements=json.dumps(job_requirements))

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert interview difficulty selector. Determine appropriate difficulty.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "difficulty": result.get("difficulty", "medium")})

        return {
            "difficulty_level": result.get("difficulty", "medium"),
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"difficulty_level": "medium", "error": str(e), "current_node": node_name}


async def question_generator_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Generate interview question based on context."""
    node_name = "QuestionGenerator"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("question_prompt.txt")
        prompt_parts = prompt_template.split("QUESTION_GENERATOR_PROMPT")[1]
        if "CROSS_QUESTION_GENERATOR_PROMPT" in prompt_parts[0]:
            prompt = prompt_parts[0].split("CROSS_QUESTION_GENERATOR_PROMPT")[0].strip()
        else:
            prompt = prompt_parts[0].strip()

        skills_to_test = state.missing_skills[:3] if state.missing_skills else state.required_skills[:3]

        formatted_prompt = prompt.format(
            role_title=state.role_title or "the role",
            difficulty=state.difficulty_level,
            skills_to_test=json.dumps(skills_to_test),
            question_type=state.current_question_type or "behavioral",
            previous_questions=json.dumps(state.previous_questions[-10:]),
        )

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert interview question generator. Generate high-quality questions.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        question = result.get("question", "")

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "question_type": result.get("question_type"), "execution_time_ms": execution_time})

        return {
            "current_question": question,
            "current_question_type": result.get("question_type", "behavioral"),
            "difficulty_level": result.get("difficulty", state.difficulty_level),
            "previous_questions": state.previous_questions + [question],
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def answer_evaluator_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Evaluate candidate's answer."""
    node_name = "AnswerEvaluator"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("evaluation_prompt.txt")
        prompt_parts = prompt_template.split("ANSWER_EVALUATOR_PROMPT")[1].split("EMOTION_DETECTOR_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        conversation_str = json.dumps(state.conversation_history[-5:])
        last_answer = state.conversation_history[-1].get("content", "") if state.conversation_history else ""

        formatted_prompt = prompt.format(
            question=state.current_question or "",
            question_type=state.current_question_type or "behavioral",
            difficulty=state.difficulty_level,
            answer=last_answer,
            conversation_history=conversation_str,
        )

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert interview answer evaluator. Provide detailed feedback.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        skill_scores = state.skill_scores.copy()
        for skill in state.required_skills:
            if skill in state.current_question.lower():
                skill_scores[skill] = result.get("overall_score", 0.0)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "overall_score": result.get("overall_score", 0.0), "execution_time_ms": execution_time})

        return {
            "evaluation": result,
            "emotion_score": result.get("emotion_score"),
            "skill_scores": skill_scores,
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def feedback_generator_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Generate comprehensive feedback."""
    node_name = "FeedbackGenerator"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("feedback_prompt.txt")
        prompt_parts = prompt_template.split("FEEDBACK_GENERATOR_PROMPT")[1].split("COMPREHENSIVE_FEEDBACK_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        questions_answers = [f"Q{i+1}: {entry.get('content', '')}" for i, entry in enumerate(state.conversation_history)]

        formatted_prompt = prompt.format(
            role_title=state.role_title or "Target Role",
            total_questions=len(state.previous_questions),
            question_types=json.dumps(list(set(state.current_question_type.split() if state.current_question_type else []))),
            difficulty=state.difficulty_level,
            questions_answers="\n".join(questions_answers),
            skill_scores=json.dumps(state.skill_scores),
        )

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert interview coach. Provide constructive feedback.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "overall_score": result.get("overall_score", 0.0), "execution_time_ms": execution_time})

        return {
            "feedback": result,
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def learning_resource_agent_node(state: InterviewState, llm_client: LLMClient) -> Dict[str, Any]:
    """Node: Recommend learning resources based on skill gaps."""
    node_name = "LearningResourceAgent"
    start_time = time.time()

    try:
        prompt_template = _load_prompt("resource_prompt.txt")
        prompt_parts = prompt_template.split("RESOURCE_RECOMMENDER_PROMPT")[1].split("SKILL_ASSESSMENT_PROMPT")
        prompt = prompt_parts[0].strip() if len(prompt_parts) > 1 else ""

        # Add YouTube search for real-time video resources
        search_context = ""
        try:
            from youtubesearchpython import VideosSearch
            if state.missing_skills:
                skills = ", ".join(state.missing_skills[:2]) # top 2 skills to not dilute search
                query = f"{skills} {state.role_title or ''} tutorial 2024"
            else:
                query = f"{state.role_title or 'interview preparation'} basics full course tutorial 2024"

            videos_search = VideosSearch(query.strip(), limit=4)
            results = videos_search.result().get("result", [])

            formatted_results = []
            for r in results:
                title = r.get("title", "")
                url = r.get("link", "")
                if url:
                    formatted_results.append(f"Title: {title}\nURL: {url}")

            search_context = "\n\n".join(formatted_results)
            logger.info(f"Fetched YouTube search context for query: {query}")
        except Exception as e:
            logger.warning(f"YouTube search failed: {e}")

        formatted_prompt = prompt.format(
            skill_gaps=json.dumps(state.missing_skills),
            current_levels=json.dumps(state.skill_scores),
            preferred_formats=json.dumps(None),
            time_constraint=json.dumps(120),
            difficulty_preference=json.dumps(state.difficulty_level),
            search_context=json.dumps(search_context),
        )

        response, token_info = await llm_client.generate(
            prompt=formatted_prompt,
            system_prompt="You are an expert learning resource recommender. Suggest high-quality resources.",
            json_response=True,
        )

        result = json.loads(response)

        execution_time = int((time.time() - start_time) * 1000)

        logger.info(f"{node_name} completed", extra={"session_id": state.session_id, "resource_count": len(result.get("resources", [])), "execution_time_ms": execution_time})

        return {
            "learning_resources": result.get("resources", []),
            "current_node": node_name,
            "prompt_tokens": state.prompt_tokens + token_info.prompt_tokens,
            "completion_tokens": state.completion_tokens + token_info.completion_tokens,
            "token_usage": {**state.token_usage, node_name: {"prompt_tokens": token_info.prompt_tokens, "completion_tokens": token_info.completion_tokens, "latency_ms": token_info.latency_ms}},
        }
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}


async def state_saver_node(state: InterviewState) -> Dict[str, Any]:
    """Node: Save state to database (placeholder for async DB operations)."""
    node_name = "StateSaver"

    try:
        logger.info(f"{node_name} - State saved", extra={"session_id": state.session_id, "question_count": state.question_count, "evaluation_count": state.evaluation_count})
        return {"current_node": node_name}
    except Exception as e:
        logger.error(f"{node_name} failed: {e}")
        return {"error": str(e), "current_node": node_name}
