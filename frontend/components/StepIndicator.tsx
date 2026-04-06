import React from "react";

export type StepState = "pending" | "active" | "complete" | "failed";

interface StepIndicatorProps {
  state: StepState;
  name: string;
  descriptionActive: string;
  resultSummary?: string;
  durationMs?: number;
  errorMessage?: string;
}

export function StepIndicator({
  state,
  name,
  descriptionActive,
  resultSummary,
  durationMs,
  errorMessage,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-16 py-8">
      {/* Icon Area */}
      <div className="w-[16px] flex items-center justify-center shrink-0">
        {state === "pending" && (
          <div className="w-[12px] h-[12px] rounded-full border border-text-muted"></div>
        )}
        {state === "active" && (
          <div className="w-[12px] h-[12px] rounded-full bg-accent animate-pulse-fast"></div>
        )}
        {state === "complete" && (
          <div className="text-success text-16 font-600">✓</div>
        )}
        {state === "failed" && (
          <div className="text-error text-16 font-600">✕</div>
        )}
      </div>

      {/* Text Area */}
      <div className="flex flex-col sm:flex-row sm:items-center w-full gap-4 sm:gap-16">
        <span
          className={`text-16 font-500 ${
            state === "active" || state === "complete"
              ? "text-text-primary"
              : "text-text-secondary"
          }`}
        >
          {name}
        </span>

        <span className="text-14 text-text-secondary sm:ml-auto">
          {state === "pending" && <span className="text-text-muted">Waiting</span>}
          {state === "active" && <span>{descriptionActive}</span>}
          {state === "complete" && (
            <span>
              {resultSummary} • {(durationMs! / 1000).toFixed(1)}s
            </span>
          )}
          {state === "failed" && <span className="text-error">{errorMessage}</span>}
        </span>
      </div>
    </div>
  );
}
