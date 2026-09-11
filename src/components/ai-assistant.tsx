"use client";

import { useRef, useState } from "react";
import { coachRoundAction, tutorChatAction } from "@/app/arena/[gameId]/ai-actions";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Assistant IA de l'élève dans l'arène : un « coach de tour » à la demande et
 * un tuteur conversationnel. Rendu seulement si la surface correspondante est
 * allumée (props calculées côté serveur). À la demande, pour maîtriser le coût.
 */
export function AiAssistant({
  gameId,
  coach,
  tutor,
}: {
  gameId: string;
  coach: boolean;
  tutor: boolean;
}) {
  if (!coach && !tutor) return null;
  return (
    <section className="mt-6 rounded-xl border border-sky-400/25 bg-sky-950/10 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden>✨</span>
        <h2 className="text-sm font-semibold text-sky-200">Assistant IA</h2>
      </div>
      {coach ? <Coach gameId={gameId} /> : null}
      {tutor ? <Tutor gameId={gameId} /> : null}
      <p className="mt-3 text-xs text-slate-500">
        Réponses générées par une IA : à vérifier, elles peuvent se tromper.
      </p>
    </section>
  );
}

function Coach({ gameId }: { gameId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function ask() {
    setPending(true);
    setError(null);
    const res = await coachRoundAction(gameId);
    setPending(false);
    if (res.ok) setText(res.text);
    else setError(res.reason);
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={ask}
        disabled={pending}
        className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Analyse en cours…" : text ? "Redemander un retour" : "Demander un retour sur mon tour"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      {text ? (
        <p className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-200">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function Tutor({ gameId }: { gameId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zone = useRef<HTMLDivElement>(null);

  async function send() {
    const q = input.trim();
    if (!q || pending) return;
    const history = messages;
    setMessages([...history, { role: "user", content: q }]);
    setInput("");
    setPending(true);
    setError(null);
    const res = await tutorChatAction(gameId, history, q);
    setPending(false);
    if (res.ok) {
      setMessages((m) => [...m, { role: "assistant", content: res.text }]);
      requestAnimationFrame(() => zone.current?.scrollTo(0, zone.current.scrollHeight));
    } else {
      setError(res.reason);
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Poser une question</p>
      {messages.length > 0 ? (
        <div ref={zone} className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-sky-400/15 px-3 py-2 text-sm text-sky-50"
                  : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm leading-relaxed text-slate-200"
              }
            >
              {m.content}
            </div>
          ))}
          {pending ? <p className="text-xs text-slate-500">L&apos;IA réfléchit…</p> : null}
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Ex : pourquoi ma trésorerie a baissé ce tour ?"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400/60"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={pending || input.trim().length === 0}
          className="shrink-0 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
