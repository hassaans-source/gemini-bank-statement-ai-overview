import React, { useEffect, useState } from 'react';
import { AppLanguage } from '../types/finance';
import { translations } from '../utils/i18n';
import { Sparkles, Check, Clock } from 'lucide-react';

interface ProcessingCardProps {
  language: AppLanguage;
  fileName: string;
}

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ language, fileName }) => {
  const t = translations[language];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const steps = [
    t.procStep1,
    t.procStep2,
    t.procStep3,
    t.procStep4,
    t.procStep5,
  ];

  useEffect(() => {
    // Step advancement every 6 seconds until final step
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 6000);

    // Elapsed timer
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [steps.length]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / steps.length) * 85 + (elapsedSeconds % 10))
  );

  return (
    <div className="py-12 flex justify-center items-center">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6 text-center">
        {/* Header with gentle animated pulse icon */}
        <div className="inline-flex p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mx-auto">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.processingTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md mx-auto">
            {fileName}
          </p>
        </div>

        {/* Soft progress bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{elapsedSeconds}s</span>
            </span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Sequential Status Lines */}
        <div className="space-y-2.5 text-left border-t border-slate-100 dark:border-slate-800 pt-4">
          {steps.map((stepText, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isCurrent
                    ? 'text-teal-700 dark:text-teal-400 font-semibold'
                    : isCompleted
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-colors ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 ring-2 ring-teal-400/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span>{stepText}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          {t.processingSubtitle}
        </p>
      </div>
    </div>
  );
};
