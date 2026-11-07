import { structuredCompletion } from "./client";
import { questionsSchema } from "./schemas";

export async function generateQuestions(pages, count) {
  const material = pages.map((page, i) => `PAGE ${page.page || i + 1}\n${page.text}`).join("\n\n").slice(0, 90000);
  const result = await structuredCompletion("study_questions", questionsSchema,
    "Create short, beginner-friendly open-ended questions grounded only in the supplied lecture pages. Use easy or medium difficulty, never hard. Cover different topics, ask one clear thing at a time, and make each question no more than 20 words so it can be understood and answered in one minute. Avoid multi-part questions, unnecessary context, jargon, and trick wording. Include accurate source page numbers.",
    `Generate exactly ${count} questions from this material:\n${material}`);
  if (result.questions.length !== count) throw new Error("AI generated an incorrect number of questions");
  return result.questions;
}
