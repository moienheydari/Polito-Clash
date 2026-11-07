import { structuredCompletion } from "./client";
import { questionsSchema } from "./schemas";

export async function generateQuestions(pages, count) {
  const material = pages.map((page, i) => `PAGE ${page.page || i + 1}\n${page.text}`).join("\n\n").slice(0, 90000);
  const result = await structuredCompletion("study_questions", questionsSchema,
    "Create university-level open-ended questions grounded only in the supplied lecture pages. Cover different topics, require reasoning, and make each answerable in one minute. Include accurate source page numbers.",
    `Generate exactly ${count} questions from this material:\n${material}`);
  if (result.questions.length !== count) throw new Error("AI generated an incorrect number of questions");
  return result.questions;
}
