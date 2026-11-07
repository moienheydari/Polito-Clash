import { requireUser, createAdminClient } from "../../../../../lib/supabase/server";
import { evaluateAnswers } from "../../../../../lib/ai/evaluateAnswers";
import { generateReport } from "../../../../../lib/ai/generateReport";
import { json, errorResponse } from "../../../../../lib/api";

export const maxDuration = 60;
export async function POST(request, { params }) {
  try {
    const user = await requireUser(); const { id } = await params; const admin = createAdminClient();
    const { data: match } = await admin.from("matches").select("*, documents(extracted_pages)").eq("id", id).single();
    const { data: players } = await admin.from("match_players").select("user_id,total_score").eq("match_id", id).order("joined_at");
    if (!match || !players?.some(p => p.user_id === user.id)) throw new Error("You are not a participant");
    const { data: question } = await admin.from("questions").select("*").eq("match_id", id).eq("position", match.current_question_index).maybeSingle();
    if (match.phase === "answering" && question && (new Date(match.question_deadline_at).getTime() <= Date.now() || (await countAnswers(admin, question.id)) >= 2)) {
      const claimed = await admin.from("matches").update({ phase: "grading", grading_claimed_at: new Date().toISOString() }).eq("id", id).eq("phase", "answering").select("id");
      if (claimed.data?.length) {
        const { data: answers } = await admin.from("answers").select("*").eq("question_id", question.id);
        const ordered = players.map(p => answers?.find(a => a.user_id === p.user_id));
        let evaluations;
        try {
          evaluations = await evaluateAnswers(question, ordered.map(a => a?.answer_text || ""), JSON.stringify(match.documents?.extracted_pages || []));
        } catch (error) {
          await admin.from("matches").update({ phase: "answering", grading_claimed_at: null }).eq("id", id).eq("phase", "grading");
          throw new Error(`AI grading failed: ${error.message}`);
        }
        for (let i = 0; i < players.length; i++) {
          const answer = ordered[i]; const evaluation = evaluations.find(e => e.student_slot === i + 1) || { score: 0 };
          if (answer) await admin.from("answers").update({ score: Math.max(0, Math.min(100, evaluation.score)), evaluation_json: evaluation, evaluated_at: new Date().toISOString() }).eq("id", answer.id);
          else await admin.from("answers").insert({ match_id: id, question_id: question.id, user_id: players[i].user_id, answer_text: "", score: 0, evaluation_json: evaluation, evaluated_at: new Date().toISOString() });
          await admin.from("match_players").update({ total_score: players[i].total_score + (evaluation.score || 0) }).eq("match_id", id).eq("user_id", players[i].user_id);
        }
        await admin.from("matches").update({ phase: "review", review_ends_at: new Date(Date.now() + 8000).toISOString(), grading_claimed_at: null }).eq("id", id).eq("phase", "grading");
      }
    } else if (match.phase === "review" && new Date(match.review_ends_at).getTime() <= Date.now()) {
      if (match.current_question_index + 1 >= match.question_count) {
        const claimed = await admin.from("matches").update({ phase: "reporting", reporting_claimed_at: new Date().toISOString() }).eq("id", id).eq("phase", "review").select("id");
        if (claimed.data?.length) {
          for (const player of players) {
            const { data: rows } = await admin.from("answers").select("*, questions(question_text,source_pages)").eq("match_id", id).eq("user_id", player.user_id).order("submitted_at");
            const report = await generateReport(player.user_id, rows || []);
            await admin.from("reports").upsert({ match_id: id, user_id: player.user_id, report_json: report }, { onConflict: "match_id,user_id" });
          }
          await admin.from("matches").update({ phase: "finished", finished_at: new Date().toISOString(), reporting_claimed_at: null }).eq("id", id).eq("phase", "reporting");
        }
      } else {
        await admin.from("matches").update({ phase: "answering", current_question_index: match.current_question_index + 1, question_started_at: new Date().toISOString(), question_deadline_at: new Date(Date.now() + 60000).toISOString(), review_ends_at: null }).eq("id", id).eq("phase", "review");
      }
    }
    return json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
async function countAnswers(admin, questionId) { const { count } = await admin.from("answers").select("id", { count: "exact", head: true }).eq("question_id", questionId); return count || 0; }
