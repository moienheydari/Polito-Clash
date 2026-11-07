import OpenAI from "openai";

export function aiClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function structuredCompletion(name, schema, system, input) {
  const response = await aiClient().responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [{ role: "system", content: system }, { role: "user", content: input }],
    text: { format: { type: "json_schema", name, strict: true, schema } }
  });
  if (!response.output_text) throw new Error("AI returned an empty response");
  return JSON.parse(response.output_text);
}
