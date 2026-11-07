import { structuredCompletion } from "./client";
import { reportSchema } from "./schemas";

export async function generateReport(player, rows) {
  return structuredCompletion("learning_report", reportSchema,
    "Write a concise personalized educational report. Base every claim on the student's answers and evaluations. Mention page numbers in study recommendations.",
    `Student: ${player}\nQuestion reviews:\n${JSON.stringify(rows)}`);
}
