import React from "react";

interface ConfidenceBadgeProps {
  score: number;
  size?: "small" | "large";
}

export function ConfidenceBadge({ score, size = "large" }: ConfidenceBadgeProps) {
  let colorClass = "text-error";
  if (score >= 75) {
    colorClass = "text-accent"; 
  } else if (score >= 50) {
    colorClass = "text-warning";
  }

  const textSizeClass = size === "large" ? "text-40 font-600" : "text-16 font-600";
  
  return (
    <div className={`flex items-baseline gap-8 font-sans`}>
      <span className={`${textSizeClass} ${colorClass}`}>{score}</span>
      {size === "large" && <span className="text-14 text-text-secondary font-500">Confidence Score</span>}
    </div>
  );
}
