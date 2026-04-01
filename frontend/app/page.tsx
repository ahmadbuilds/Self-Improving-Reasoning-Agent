"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, RotateCcw } from "lucide-react";
import ReasoningBlock from "./components/ReasoningBlock";

interface ResponseData {
  question: string;
  response: string;
  reasoning: string;
  predicted_class: "Correct" | "Wrong";
  critic_confidence_scores: number[][];
}

type Stage = "idle" | "reasoning" | "evaluating" | "done";

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setStage("reasoning");

    const simulateEvaluating = setTimeout(() => {
      setStage("evaluating");
    }, 2200);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });

      clearTimeout(simulateEvaluating);

      if (!res.ok) throw new Error("Failed to fetch response");
      const data: ResponseData = await res.json();
      setStage("done");
      setResult(data);
    } catch {
      clearTimeout(simulateEvaluating);
      setStage("idle");
      setError("Connection failed. Please ensure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setStage("idle");
    setInput("");
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
          Two-Stage Reasoning Pipeline
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight leading-tight">
          Math Reasoning Agent
        </h1>
        <p className="mt-3 text-stone-400 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Deep reasoning paired with a critic model that evaluates its own answers.
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
          done={stage === "evaluating" || stage === "done"}
        />
        <div className="flex items-center gap-1 px-1">
          <motion.div
            className="h-px bg-stone-300 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: stage === "evaluating" || stage === "done" ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ width: 28 }}
          />
          <ArrowRight className="w-3 h-3 text-stone-300" />
        </div>
        <PipelineStep
          number="02"
          label="DeBERTa Critic"
          active={stage === "evaluating"}
          done={stage === "done"}
        />
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">

          {/* Input Area */}
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
                className="w-full resize-none bg-transparent border-none outline-none text-stone-800 placeholder-stone-300 text-base leading-relaxed min-h-18 max-h-48 disabled:opacity-50 transition-opacity"
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

        {/* Status / Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm"
            >
              <LoadingStages stage={stage} />
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
              {/* Reasoning Block */}
              {result.reasoning && (
                <ReasoningBlock reasoning={result.reasoning} />
              )}

              {/* Answer */}
              <div className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-medium text-stone-400 tracking-widest uppercase mb-3">Answer</p>
                <p className="text-stone-800 text-base leading-relaxed whitespace-pre-wrap">
                  {result.response}
                </p>
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

                {/* Confidence Bars */}
                {result.critic_confidence_scores?.[0] && (
                  <div className="space-y-3">
                    <ConfidenceBar label="Correct" value={correctScore ?? 0} color="emerald" />
                    <ConfidenceBar label="Wrong" value={wrongScore ?? 0} color="red" />
                  </div>
                )}
              </div>

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
        Answers are generated then independently evaluated by a fine-tuned critic model.
      </p>
    </div>
  );
}

/* ── Sub-components ── */

function PipelineStep({
  number,
  label,
  active,
  done,
}: {
  number: string;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-300"
      style={{
        background: done ? "#f0fdf4" : active ? "#fafaf9" : "transparent",
        border: done ? "1px solid #bbf7d0" : active ? "1px solid #e7e5e4" : "1px solid transparent",
      }}
    >
      <span
        className="text-xs font-mono font-semibold transition-colors duration-300"
        style={{ color: done ? "#16a34a" : active ? "#292524" : "#a8a29e" }}
      >
        {number}
      </span>
      <span
        className="text-xs font-medium transition-colors duration-300 hidden sm:block"
        style={{ color: done ? "#15803d" : active ? "#44403c" : "#a8a29e" }}
      >
        {label}
      </span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      )}
      {done && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
      )}
    </div>
  );
}

const STAGE_COPY: Record<Stage, { title: string; sub: string }> = {
  idle: { title: "", sub: "" },
  reasoning: {
    title: "Stage 1 — Groq Reasoning",
    sub: "Generating step-by-step reasoning using extended thinking…",
  },
  evaluating: {
    title: "Stage 2 — DeBERTa Critic",
    sub: "Tokenizing and scoring the response with the fine-tuned critic model…",
  },
  done: { title: "", sub: "" },
};

function LoadingStages({ stage }: { stage: Stage }) {
  const copy = STAGE_COPY[stage];
  return (
    <div className="p-5 sm:p-6 flex items-start gap-4">
      <div className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 shrink-0">
        <span className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin block" />
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-medium text-stone-800 text-sm mb-0.5">{copy.title}</p>
            <p className="text-stone-400 text-sm leading-relaxed">{copy.sub}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-stone-300"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "red";
}) {
  const pct = Math.round(value * 100);
  const barColor = color === "emerald" ? "#10b981" : "#f87171";
  const bgColor = color === "emerald" ? "#f0fdf4" : "#fef2f2";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-xs font-mono font-medium text-stone-700">{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: bgColor }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}