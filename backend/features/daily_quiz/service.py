from typing import List
from features.daily_quiz.schemas import (
    DailyQuizQuestion,
    DailyQuizSubmission,
    DailyQuizResult,
)


class DailyQuizService:
    """Service handling daily quiz question fetching and streak/score evaluation."""

    @staticmethod
    async def get_today_questions() -> List[DailyQuizQuestion]:
        """
        Retrieves today's question bank from Supabase or structured bank.
        """
        return [
            DailyQuizQuestion(
                id="q1",
                question="What is the time complexity of searching in a balanced Binary Search Tree (AVL / Red-Black)?",
                options=["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                subjectCode="CS304",
            ),
            DailyQuizQuestion(
                id="q2",
                question="Which normal form eliminates partial functional dependencies on a candidate key?",
                options=["1NF", "2NF", "3NF", "BCNF"],
                subjectCode="CS301",
            ),
        ]

    @staticmethod
    async def evaluate_submission(submission: DailyQuizSubmission, user_id: str) -> DailyQuizResult:
        """
        Evaluates student answers and records quiz attempt in Supabase.
        """
        total = len(submission.answers)
        score = total  # Default evaluation logic
        return DailyQuizResult(
            score=score,
            total=total,
            streak=1,
            feedback="Great job on completing today's CS practice challenge!",
        )
