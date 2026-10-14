import { db, StudentAttempt, StudentProgress, WeakTopic } from '../db/store.js';

export interface SubmitTestPayload {
  student_id: string;
  test_id: string;
  time_taken: number; // in seconds
  answers: {
    question_id: string;
    answer: string;
  }[];
}

export interface EvaluationResult {
  attempt_id: string;
  score: number;
  total: number;
  percentage: number;
  correct_count: number;
  wrong_count: number;
  time_taken: number;
  topic_breakdown: {
    topic: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  weak_topics: {
    topic: string;
    accuracy: number;
    recommendation: string;
  }[];
  answers_evaluated: {
    question_id: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    marks: number;
    feedback: string;
    topic: string;
    explanation: string;
  }[];
}

export class AnswerEvaluatorService {
  async evaluateAttempt(payload: SubmitTestPayload): Promise<EvaluationResult> {
    const test = db.tests.find((t) => t.id === payload.test_id);
    if (!test) {
      throw new Error(`Test with ID ${payload.test_id} not found.`);
    }

    const targetClass = db.classes.find((c) => c.id === test.class_id);
    const className = targetClass?.name || 'Class 1';

    let totalMarks = 0;
    let earnedMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const topicStats: Record<string, { total: number; correct: number }> = {};

    const evaluatedAnswers = payload.answers.map((userAns) => {
      const question = db.questions.find((q) => q.id === userAns.question_id);
      if (!question) {
        return {
          question_id: userAns.question_id,
          question_text: 'Question',
          user_answer: userAns.answer,
          correct_answer: '',
          is_correct: false,
          marks: 0,
          feedback: 'Question no longer in database',
          topic: 'General',
          explanation: '',
        };
      }

      totalMarks += 1;
      const topic = question.topic || 'General Grammar';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total += 1;

      // Normalize comparison
      const cleanUser = (userAns.answer || '').trim().toLowerCase();
      const cleanCorrect = (question.correct_answer || '').trim().toLowerCase();
      const isCorrect = cleanUser === cleanCorrect;

      let marks = 0;
      let feedback = '';

      if (isCorrect) {
        earnedMarks += 1;
        correctCount += 1;
        marks = 1;
        topicStats[topic].correct += 1;
        feedback = `Great work! ${question.correct_answer} is the correct answer.`;
      } else {
        wrongCount += 1;
        feedback = `Not quite. The correct answer is "${question.correct_answer}". ${question.explanation}`;
      }

      return {
        question_id: question.id,
        question_text: question.question_text,
        user_answer: userAns.answer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        marks,
        feedback,
        topic,
        explanation: question.explanation || '',
      };
    });

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

    // Calculate topic breakdown
    const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return {
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracy,
      };
    });

    // Detect weak topics (< 65% accuracy)
    const weakTopicsList = topicBreakdown
      .filter((t) => t.accuracy < 65)
      .map((t) => ({
        topic: t.topic,
        accuracy: t.accuracy,
        recommendation: `Focus on ${t.topic}. Review lesson explanations and practice with 5 targeted exercises.`,
      }));

    // Save attempt record
    const attemptId = `attempt-${Date.now()}`;
    const newAttempt: StudentAttempt = {
      id: attemptId,
      student_id: payload.student_id,
      test_id: payload.test_id,
      score: earnedMarks,
      percentage,
      started_at: new Date(Date.now() - (payload.time_taken * 1000)).toISOString(),
      completed_at: new Date().toISOString(),
      time_taken: payload.time_taken,
      answers: evaluatedAnswers.map((a) => ({
        question_id: a.question_id,
        answer: a.user_answer,
        is_correct: a.is_correct,
        marks: a.marks,
        feedback: a.feedback,
        topic: a.topic,
      })),
    };

    db.student_attempts.push(newAttempt);
    db.logActivity('TEST_SUBMIT', `Assessment completed: Score ${earnedMarks}/${totalMarks} (${percentage}%)`, {
      testId: payload.test_id,
      score: earnedMarks,
      percentage,
    });

    // Update Weak Topics in database
    weakTopicsList.forEach((wt) => {
      const existing = db.weak_topics.find(
        (item) => item.student_id === payload.student_id && item.topic === wt.topic
      );
      if (existing) {
        existing.accuracy = wt.accuracy;
        existing.recommended_action = wt.recommendation;
        existing.updated_at = new Date().toISOString();
      } else {
        db.weak_topics.push({
          id: `wt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          student_id: payload.student_id,
          topic: wt.topic,
          accuracy: wt.accuracy,
          recommended_action: wt.recommendation,
          updated_at: new Date().toISOString(),
        });
      }
    });

    // Update Student Progress
    const existingProgress = db.student_progress.find(
      (p) => p.student_id === payload.student_id && p.class_id === test.class_id
    );
    if (existingProgress) {
      existingProgress.last_score = percentage;
      existingProgress.completion_percentage = Math.min(100, existingProgress.completion_percentage + 15);
      existingProgress.updated_at = new Date().toISOString();
    } else {
      db.student_progress.push({
        id: `prog-${Date.now()}`,
        student_id: payload.student_id,
        class_id: test.class_id,
        lesson_id: test.lesson_id || 'general',
        completion_percentage: 25,
        last_score: percentage,
        updated_at: new Date().toISOString(),
      });
    }

    return {
      attempt_id: attemptId,
      score: earnedMarks,
      total: totalMarks,
      percentage,
      correct_count: correctCount,
      wrong_count: wrongCount,
      time_taken: payload.time_taken,
      topic_breakdown: topicBreakdown,
      weak_topics: weakTopicsList,
      answers_evaluated: evaluatedAnswers,
    };
  }
}

export const answerEvaluatorService = new AnswerEvaluatorService();
