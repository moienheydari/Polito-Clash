export const questionsSchema = {
  type: "object", additionalProperties: false, required: ["questions"],
  properties: { questions: { type: "array", minItems: 1, items: {
    type: "object", additionalProperties: false, required: ["question", "topic", "difficulty", "ideal_answer", "grading_criteria", "source_pages"],
    properties: {
      question: { type: "string" }, topic: { type: "string" }, difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      ideal_answer: { type: "string" }, grading_criteria: { type: "array", items: { type: "string" } },
      source_pages: { type: "array", items: { type: "integer" } }
    }
  } } }
};

export const evaluationsSchema = {
  type: "object", additionalProperties: false, required: ["evaluations"],
  properties: { evaluations: { type: "array", minItems: 2, maxItems: 2, items: {
    type: "object", additionalProperties: false, required: ["student_slot", "score", "correct_points", "mistakes", "feedback", "improved_answer", "topics_to_review"],
    properties: {
      student_slot: { type: "integer", enum: [1, 2] }, score: { type: "integer", minimum: 0, maximum: 100 },
      correct_points: { type: "array", items: { type: "string" } }, mistakes: { type: "array", items: { type: "string" } },
      feedback: { type: "string" }, improved_answer: { type: "string" }, topics_to_review: { type: "array", items: { type: "string" } }
    }
  } } }
};

export const reportSchema = {
  type: "object", additionalProperties: false, required: ["summary", "strengths", "weaknesses", "topics_to_review", "study_recommendations", "question_review"],
  properties: {
    summary: { type: "string" }, strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } }, topics_to_review: { type: "array", items: { type: "string" } },
    study_recommendations: { type: "array", items: { type: "string" } },
    question_review: { type: "array", items: { type: "object", additionalProperties: false, required: ["question", "score", "feedback", "pages"], properties: {
      question: { type: "string" }, score: { type: "integer", minimum: 0, maximum: 100 }, feedback: { type: "string" }, pages: { type: "array", items: { type: "integer" } }
    } } }
  }
};
