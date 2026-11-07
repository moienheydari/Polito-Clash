"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "../../../components/Nav";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

export default function Match() {
  const { id } = useParams();
  const answerQuestionId = useRef(null);
  const [state, setState] = useState(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(60);

  async function load() {
    const response = await fetch(`/api/matches/${id}/state`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error);
      return;
    }

    setState(data);

    // Polling should never replace an active local draft with the server's
    // previous value. Only hydrate on a new question or after submission.
    if (
      data.question?.answer !== undefined &&
      (answerQuestionId.current !== data.question.id || data.submitted)
    ) {
      answerQuestionId.current = data.question.id;
      setAnswer(data.question.answer);
    }
  }

  useEffect(() => {
    load();

    const timer = setInterval(async () => {
      await fetch(`/api/matches/${id}/progress`, { method: "POST" });
      load();
    }, 2000);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${id}` },
        load
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_players",
          filter: `match_id=eq.${id}`,
        },
        load
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `match_id=eq.${id}`,
        },
        load
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!state?.match?.question_deadline_at) return undefined;

    const tick = () => {
      setRemaining(
        Math.max(
          0,
          Math.ceil(
            (new Date(state.match.question_deadline_at).getTime() - Date.now()) /
              1000
          )
        )
      );
    };

    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [state?.match?.question_deadline_at]);

  useEffect(() => {
    if (
      remaining === 0 &&
      state?.match?.phase === "answering" &&
      !state.submitted &&
      answer.trim()
    ) {
      submit();
    }
  }, [remaining, state?.match?.phase, state?.submitted]);

  async function start() {
    const response = await fetch(`/api/matches/${id}/start`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    load();
  }

  async function submit() {
    const response = await fetch(`/api/matches/${id}/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    load();
  }

  if (!state) {
    return (
      <>
        <Nav />
        <main className="p-8 text-center">Loading competition...</main>
      </>
    );
  }

  const { match } = state;
  const players = match.match_players || [];
  const sortedPlayers = [...players].sort(
    (first, second) => second.total_score - first.total_score
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-widest text-orange">
              {match.phase}
            </p>
            <h1 className="text-3xl font-black text-navy">{match.title}</h1>
            <p className="mt-1 text-slate-500">
              Room code <b>{match.join_code}</b> · {match.documents?.filename}
            </p>
          </div>
          <div className="rounded-2xl bg-orange px-6 py-3 text-center text-white">
            <div className="text-3xl font-black">{remaining}s</div>
            <div className="text-xs font-bold uppercase">remaining</div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {match.phase === "waiting" && (
          <WaitingRoom
            match={match}
            players={players}
            isHost={state.isHost}
            onStart={start}
          />
        )}

        {match.phase !== "waiting" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <section className="card">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-bold text-slate-500">
                  Question {(match.current_question_index || 0) + 1} /{" "}
                  {match.question_count}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">
                  {state.question?.topic}
                </span>
              </div>

              {state.question && (
                <>
                  <h2 className="text-2xl font-black leading-snug text-navy">
                    {state.question.question_text}
                  </h2>

                  {match.phase === "answering" && (
                    <>
                      <textarea
                        disabled={state.submitted || remaining === 0}
                        className="field mt-8 min-h-48 resize-y"
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        placeholder="Explain your reasoning..."
                      />
                      <button
                        disabled={state.submitted || remaining === 0}
                        onClick={submit}
                        className="btn-primary mt-5 w-full"
                      >
                        {state.submitted
                          ? "Answer submitted - waiting for your opponent"
                          : remaining === 0
                            ? "Time is up"
                            : "Submit answer"}
                      </button>
                    </>
                  )}

                  {match.phase === "grading" && (
                    <p className="mt-8 rounded-xl bg-orange/10 p-4 font-bold text-orange">
                      Both answers are being evaluated by AI...
                    </p>
                  )}

                  {match.phase === "review" && state.question.feedback && (
                    <div className="mt-8 rounded-2xl bg-slate-50 p-5">
                      <div className="text-4xl font-black text-orange">
                        {state.question.feedback.score}/100
                      </div>
                      <p className="mt-3">{state.question.feedback.feedback}</p>
                      <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
                        {state.question.feedback.mistakes?.map((mistake) => (
                          <li key={mistake}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </section>

            <aside className="card h-fit">
              <h3 className="text-lg font-black text-navy">Leaderboard</h3>
              <div className="mt-5 space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={player.user_id}
                  >
                    <span>
                      <b className="mr-2 text-orange">0{index + 1}</b>
                      {player.profiles?.display_name}
                    </span>
                    <b>{player.total_score} pts</b>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t pt-4 text-sm text-slate-500">
                Your opponent's answer stays hidden until grading.
              </p>
            </aside>
          </div>
        )}

        {match.phase === "finished" && (
          <div className="card mt-6 text-center">
            <h2 className="text-3xl font-black text-navy">
              Competition complete
            </h2>
            <a
              href={`/matches/${id}/results`}
              className="btn-primary mt-5 inline-block"
            >
              View your learning report
            </a>
          </div>
        )}
      </main>
    </>
  );
}

function WaitingRoom({ match, players, isHost, onStart }) {
  return (
    <div className="card mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-black">Waiting room</h2>
      <p className="mt-3 text-slate-500">
        Share the code <b className="text-navy">{match.join_code}</b> with another
        student.
      </p>
      <div className="my-7 grid gap-3 sm:grid-cols-2">
        {players.map((player) => (
          <div className="rounded-xl bg-slate-50 p-4 font-bold" key={player.user_id}>
            {player.profiles?.display_name}
            <span className="ml-2 text-green-600">● connected</span>
          </div>
        ))}
      </div>
      {isHost && (
        <button
          disabled={players.length !== 2}
          onClick={onStart}
          className="btn-primary"
        >
          {players.length === 2 ? "Start competition" : "Waiting for opponent"}
        </button>
      )}
    </div>
  );
}
