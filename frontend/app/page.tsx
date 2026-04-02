"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, RotateCcw, RefreshCw, ChevronDown } from "lucide-react";
import ReasoningBlock from "./components/ReasoningBlock";

interface AttemptHistory {
  cycle: number;
  answer: string;
  predicted_class: "Correct" | "Wrong";
  confidence_scores: number[][];
}

interface ResponseData {
  question: string;
  response: string;
  reasoning: string;
  predicted_class: "Correct" | "Wrong";
  critic_confidence_scores: number[][];
  self_improve_attempts: number;
  max_self_improve_retries: number;
  attempts_history: AttemptHistory[];
}

type Stage = "idle" | "reasoning" | "evaluating" | "retrying" | "done";

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setRetryCount(0);
    setShowHistory(false);
    setStage("reasoning");

    const t1 = setTimeout(() => setStage("evaluating"), 2200);
    const t2 = setTimeout(() => { setStage("retrying"); setRetryCount(1); }, 5000);
    const t3 = setTimeout(() => setStage("reasoning"), 7200);
    const t4 = setTimeout(() => setStage("evaluating"), 9400);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });

      [t1, t2, t3, t4].forEach(clearTimeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch response");
      }
      const data: ResponseData = await res.json();

      setRetryCount(data.self_improve_attempts ?? 0);
      setStage("done");
      setResult(data);
    } catch (err: any) {
      [t1, t2, t3, t4].forEach(clearTimeout);
      setStage("idle");
      setError(
        err?.message === "Failed to fetch"
          ? "The reasoning engine is currently unreachable. Please try again later."
          : err?.message || "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setStage("idle");
    setRetryCount(0);
    setInput("");
    setShowHistory(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const correctScore = result?.critic_confidence_scores?.[0]?.[1];
  const wrongScore = result?.critic_confidence_scores?.[0]?.[0];

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-start px-4 py-16 sm:py-24 font-(family-name:--font-geist-sans)">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-500 text-xs font-medium tracking-wide mb-5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Self-Improving Reasoning Pipeline
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight leading-tight">
          Math Reasoning Agent
        </h1>
        <p className="mt-3 text-stone-400 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Deep reasoning with a critic model that triggers self-correction when wrong.
        </p>
      </motion.div>

      {/* Pipeline Steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center gap-1.5 mb-10"
      >
        <PipelineStep
          number="01"
          label="Groq Reasoning"
          active={stage === "reasoning"}
          done={stage === "evaluating" || stage === "retrying" || stage === "done"}
          retrying={stage === "retrying"}
        />
        <PipelineConnector active={stage === "evaluating" || stage === "retrying" || stage === "done"} />
        <PipelineStep
          number="02"
          label="DeBERTa Critic"
          active={stage === "evaluating"}
          done={stage === "done" && retryCount === 0}
          retrying={stage === "retrying"}
        />
        <AnimatePresence>
          {(stage === "retrying" || (stage === "done" && retryCount > 0)) && (
            <>
              <PipelineConnector active reverse />
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3 }}
              >
                <PipelineStep
                  number="↺"
                  label="Self-Improve"
                  active={stage === "retrying"}
                  done={stage === "done" && retryCount > 0}
                  retrying={false}
                  isRetry
                  retryCount={retryCount}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-5 sm:p-6">
              <label className="block text-xs font-medium text-stone-400 tracking-widest uppercase mb-3">
                Question
              </label>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isLoading}
                placeholder="e.g. If a train travels 120km in 1.5 hours, what is its speed?"
                className="w-full resize-none bg-transparent border-none outline-none text-stone-800 placeholder-stone-300 text-base leading-relaxed min-h-[72px] max-h-48 disabled:opacity-50 transition-opacity"
                rows={2}
              />
            </div>
            <div className="px-5 sm:px-6 pb-5 flex items-center justify-between border-t border-stone-100 pt-4">
              <span className="text-xs text-stone-300">Shift+Enter for new line</span>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 transition-all duration-200 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Stage Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm"
            >
              <LoadingStages stage={stage} retryCount={retryCount} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && stage === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-4 space-y-3"
            >
              {/* Self-improve banner */}
              {result.self_improve_attempts > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Self-improved{" "}
                    <span className="font-semibold">{result.self_improve_attempts}×</span>{" "}
                    before reaching this answer
                    {result.predicted_class === "Correct"
                      ? " — critic approved."
                      : ` (max ${result.max_self_improve_retries} retries reached).`}
                  </p>
                </motion.div>
              )}

              {/* Reasoning Block */}
              {result.reasoning && <ReasoningBlock reasoning={result.reasoning} />}

              {/* Answer */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-medium text-stone-400 tracking-widest uppercase mb-3">Answer</p>
                <p className="text-stone-800 text-base leading-relaxed whitespace-pre-wrap">{result.response}</p>
              </div>

              {/* Critic Evaluation */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-medium text-stone-400 tracking-widest uppercase mb-4">Critic Evaluation</p>
                <div className="flex items-center gap-4 mb-5">
                  <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    result.predicted_class === "Correct"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${result.predicted_class === "Correct" ? "bg-emerald-400" : "bg-red-400"}`} />
                    {result.predicted_class}
                  </div>
                  <span className="text-stone-400 text-sm">DeBERTa model verdict</span>
                </div>
                {result.critic_confidence_scores?.[0] && (
                  <div className="space-y-3">
                    <ConfidenceBar label="Correct" value={correctScore ?? 0} color="emerald" />
                    <ConfidenceBar label="Wrong" value={wrongScore ?? 0} color="red" />
                  </div>
                )}
              </div>

              {/* Attempt History */}
              {result.attempts_history && result.attempts_history.length > 1 && (
                <div className="bg-white border border-stone-200/80 rounded-2xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left hover:bg-stone-50 transition-colors duration-150 focus:outline-none"
                  >
                    <div>
                      <p className="text-xs font-medium text-stone-400 tracking-widest uppercase">Attempt History</p>
                      <p className="text-sm text-stone-500 mt-0.5">
                        {result.attempts_history.length} generations — click to inspect
                      </p>
                    </div>
                    <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.25 }}>
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {showHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-stone-100 divide-y divide-stone-100">
                          {result.attempts_history.map((attempt) => {
                            const cScore = attempt.confidence_scores?.[0]?.[1];
                            const wScore = attempt.confidence_scores?.[0]?.[0];
                            const isCorrect = attempt.predicted_class === "Correct";
                            return (
                              <motion.div
                                key={attempt.cycle}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: attempt.cycle * 0.05 }}
                                className="px-5 sm:px-6 py-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-mono font-semibold text-stone-400">Cycle {attempt.cycle}</span>
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                                  }`}>
                                    {attempt.predicted_class}
                                  </span>
                                </div>
                                <p className="text-sm text-stone-600 leading-relaxed mb-3 line-clamp-2">
                                  {attempt.answer}
                                </p>
                                <div className="space-y-1.5">
                                  <MiniBar label="Correct" value={cScore ?? 0} color="emerald" />
                                  <MiniBar label="Wrong" value={wScore ?? 0} color="red" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white border border-transparent hover:border-stone-200 text-sm font-medium transition-all duration-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ask another question
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="mt-12 text-xs text-stone-300 text-center max-w-xs">
        Answers are generated then independently evaluated. If wrong, the agent self-corrects up to 3 times.
      </p>
    </div>
  );
}


function PipelineStep({
  number, label, active, done, retrying, isRetry = false, retryCount = 0,
}: {
  number: string; label: string; active: boolean; done: boolean;
  retrying: boolean; isRetry?: boolean; retryCount?: number;
}) {
  const bgColor = isRetry ? (done || active ? "#fffbeb" : "transparent")
    : done ? "#f0fdf4" : active ? "#fafaf9" : "transparent";
  const borderColor = isRetry ? (done || active ? "#fde68a" : "transparent")
    : done ? "#bbf7d0" : active ? "#e7e5e4" : "transparent";
  const numColor = isRetry ? (done || active ? "#b45309" : "#a8a29e")
    : done ? "#16a34a" : active ? "#292524" : "#a8a29e";
  const lblColor = isRetry ? (done || active ? "#92400e" : "#a8a29e")
    : done ? "#15803d" : active ? "#44403c" : "#a8a29e";

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-300"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <span className="text-xs font-mono font-semibold transition-colors duration-300" style={{ color: numColor }}>
        {number}
      </span>
      <span className="text-xs font-medium transition-colors duration-300 hidden sm:block" style={{ color: lblColor }}>
        {label}
      </span>
      {isRetry && retryCount > 0 && (
        <AnimatePresence>
          <motion.span
            key={retryCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800"
          >
            ×{retryCount}
          </motion.span>
        </AnimatePresence>
      )}
      {active && !isRetry && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {active && isRetry && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="block"
        >
          <RefreshCw className="w-3 h-3 text-amber-500" />
        </motion.span>
      )}
      {done && !active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`w-1.5 h-1.5 rounded-full ${isRetry ? "bg-amber-400" : "bg-emerald-400"}`}
        />
      )}
    </div>
  );
}

function PipelineConnector({ active, reverse = false }: { active: boolean; reverse?: boolean }) {
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      {reverse ? (
        <>
          <ArrowRight className="w-3 h-3 text-stone-300 rotate-180" />
          <motion.div
            className="h-px bg-stone-300 origin-right"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: 20 }}
          />
        </>
      ) : (
        <>
          <motion.div
            className="h-px bg-stone-300 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: 20 }}
          />
          <ArrowRight className="w-3 h-3 text-stone-300" />
        </>
      )}
    </div>
  );
}

const STAGE_COPY: Record<Stage, { title: string; sub: string }> = {
  idle: { title: "", sub: "" },
  reasoning: { title: "Stage 1 — Groq Reasoning", sub: "Generating step-by-step reasoning using extended thinking…" },
  evaluating: { title: "Stage 2 — DeBERTa Critic", sub: "Tokenizing and scoring the response with the fine-tuned critic model…" },
  retrying: { title: "Self-Improving — Regenerating", sub: "Critic flagged the answer as Wrong. Asking Groq to reason again…" },
  done: { title: "", sub: "" },
};

function LoadingStages({ stage, retryCount }: { stage: Stage; retryCount: number }) {
  const copy = STAGE_COPY[stage];
  const isRetrying = stage === "retrying";

  return (
    <div className="p-5 sm:p-6 flex items-start gap-4">
      <div
        className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-colors duration-300"
        style={{ background: isRetrying ? "#fffbeb" : "#f5f5f4" }}
      >
        {isRetrying ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </motion.div>
        ) : (
          <span className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin block" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium text-stone-800 text-sm">{copy.title}</p>
              {isRetrying && retryCount > 0 && (
                <motion.span
                  key={retryCount}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700"
                >
                  attempt {retryCount}
                </motion.span>
              )}
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isRetrying ? "#fcd34d" : "#d6d3d1" }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: "emerald" | "red" }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-xs font-mono font-medium text-stone-700">{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: color === "emerald" ? "#f0fdf4" : "#fef2f2" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color === "emerald" ? "#10b981" : "#f87171" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: "emerald" | "red" }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-stone-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: color === "emerald" ? "#f0fdf4" : "#fef2f2" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color === "emerald" ? "#10b981" : "#f87171" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
      <span className="text-[11px] font-mono text-stone-400 w-8 text-right">{pct}%</span>
    </div>
  );
}