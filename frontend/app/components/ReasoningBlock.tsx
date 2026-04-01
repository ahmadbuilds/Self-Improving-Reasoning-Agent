"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BrainCircuit } from "lucide-react";

interface ReasoningBlockProps {
  reasoning: string;
}

export default function ReasoningBlock({ reasoning }: ReasoningBlockProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors duration-200"
      style={{ borderColor: isOpen ? "#d6d3d1" : "#e7e5e4" }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 sm:px-6 py-4 text-left hover:bg-stone-50/80 transition-colors duration-150 focus:outline-none"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 shrink-0">
          <BrainCircuit className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-700">Thought Process</p>
          {!isOpen && (
            <p className="text-xs text-stone-400 mt-0.5 truncate">
              {reasoning.slice(0, 80)}…
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ChevronDown className="w-4 h-4 text-stone-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-stone-100">
              <div className="text-sm text-stone-500 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-1 font-(family-name:--font-geist-mono) text-[13px]">
                {reasoning}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}