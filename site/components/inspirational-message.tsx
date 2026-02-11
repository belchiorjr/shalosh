"use client";

import { useEffect, useState } from "react";

import { inspirationalQuotes } from "@/data/inspirational-quotes";

const STORAGE_KEY = "shalosh:lastInspirationalQuote";

export function InspirationalMessage() {
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!inspirationalQuotes.length) {
      return;
    }

    let lastIndex = -1;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = Number.parseInt(stored, 10);
        if (!Number.isNaN(parsed)) {
          lastIndex = parsed;
        }
      }
    } catch {
      lastIndex = -1;
    }

    let nextIndex = Math.floor(Math.random() * inspirationalQuotes.length);

    if (inspirationalQuotes.length > 1 && nextIndex === lastIndex) {
      nextIndex =
        (nextIndex +
          1 +
          Math.floor(Math.random() * (inspirationalQuotes.length - 1))) %
        inspirationalQuotes.length;
    }

    setQuoteIndex(nextIndex);

    try {
      window.localStorage.setItem(STORAGE_KEY, String(nextIndex));
    } catch {
      // If storage is blocked, just skip persistence.
    }
  }, []);

  if (quoteIndex === null) {
    return null;
  }

  const quote = inspirationalQuotes[quoteIndex];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-default-100/40 bg-gradient-to-br from-[#141823] via-[#0e1117] to-[#0b0c0f] p-8 md:p-10">
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#FFC400]/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-[#FFC400]/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          <span>Mensagem do dia</span>
          <span className="rounded-full border border-[#FFC400]/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#FFC400]">
            {quote.category}
          </span>
        </div>
        <p className="text-xl font-semibold text-white md:text-2xl lg:text-3xl">
          {quote.text}
        </p>
        <p className="text-sm text-white/70 md:text-base">
          — {quote.author}, {quote.reference}
        </p>
        <p className="text-xs text-white/50">
          Mensagens inspiradas em referências cristãs (paráfrases).
        </p>
      </div>
    </section>
  );
}
