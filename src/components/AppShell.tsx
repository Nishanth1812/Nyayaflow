"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Dictionary, Locale } from "../lib/i18n";
import { Icon } from "./Icons";
import { Stepper } from "./ui/Stepper";

type AppShellProps = {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  currentStage: number;
  onBack: () => void;
  onLocaleChange: (locale: Locale) => void;
};

export function AppShell({ children, dictionary, locale, currentStage, onBack, onLocaleChange }: AppShellProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stageRef.current?.focus();
  }, [currentStage]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <main className="min-h-screen bg-cream px-3 py-3 text-ink sm:px-6 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-ink/15 bg-paper shadow-card sm:min-h-[calc(100vh-3rem)]">
        <header className="sticky top-0 z-10 border-b border-ink/15 bg-paper/95 px-4 pb-4 pt-4 backdrop-blur sm:px-7 sm:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-paper">
                <span className="text-base font-extrabold tracking-[-0.08em]">N<span className="text-saffron">F</span></span>
              </div>
              <div>
                <p className="text-lg font-bold tracking-[-0.01em]">NyayaFlow</p>
                <p className="hidden text-[0.7rem] font-medium text-ink/55 sm:block">{dictionary.brandTagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="sr-only">{dictionary.languageLabel}</span>
              <div className="flex rounded-full border border-ink/15 bg-cream p-1 text-xs font-bold" role="group" aria-label={dictionary.languageLabel}>
                {(["en", "ta", "hi"] as Locale[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={locale === option}
                    onClick={() => onLocaleChange(option)}
                    className={`focus-ring rounded-full px-3 py-2 transition ${locale === option ? "bg-ink text-paper shadow-sm" : "text-ink/60 hover:text-ink"}`}
                  >
                    {option === "en" ? "EN" : option === "ta" ? "தமிழ்" : "हिंदी"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            {currentStage > 0 ? (
              <button type="button" onClick={onBack} className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/65 transition hover:border-teal hover:text-teal" aria-label={dictionary.back}>
                <Icon name="arrow" size={18} />
              </button>
            ) : <div className="w-10 shrink-0" aria-hidden="true" />}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-ink/60">{dictionary.stages[currentStage]}</p>
              <Stepper stages={dictionary.stages} current={currentStage} />
            </div>
          </div>
        </header>
        {!online ? (
          <div role="status" className="flex items-center gap-3 border-b border-saffron/30 bg-saffronSoft px-4 py-3 text-sm font-bold text-ink sm:px-7">
            <Icon name="warning" size={18} className="shrink-0 text-saffron" />
            <span>You’re offline. Saved progress stays on this device, and recently viewed updates may still open.</span>
          </div>
        ) : null}
        <section className="flex-1 px-4 py-7 sm:px-12 sm:py-10">
          <div key={currentStage} ref={stageRef} tabIndex={-1} aria-label={dictionary.stages[currentStage]} className="motion-stage outline-none">
            {children}
          </div>
        </section>
        <footer className="border-t border-ink/15 px-4 py-4 text-center text-xs font-semibold text-ink/45 sm:px-7">
          {dictionary.needHelp} <span className="text-teal">1800-XXX-NYAYA</span>
        </footer>
      </div>
    </main>
  );
}
