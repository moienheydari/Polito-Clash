import { structuredCompletion } from "./client";
import { evaluationsSchema } from "./schemas";

export async function evaluateAnswers(question, answers, context) {
  const result = await structuredCompletion("answer_evaluations", evaluationsSchema,
    "Grade both answers independently against the same rubric. Reward valid reasoning and partial credit, penalize factual errors, and never infer missing content. Scores must be 0-100.",
    `Question: ${question.question_text}\nIdeal answer: ${question.ideal_answer}\nRubric: ${JSON.stringify(question.grading_criteria)}\nLecture context: ${context}\nStudent 1 answer: ${answers[0] || "(no response)"}\nStudent 2 answer: ${answers[1] || "(no response)"}`);
  return result.evaluations;
}
