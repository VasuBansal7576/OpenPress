import React, { useState } from "react";

interface Snippet {
  domain: string;
  text: string;
}

interface Reasoning {
  query: string;
  snippets: Snippet[];
  explanation: string;
}

export interface TraceStep {
  name: string;
  status: string;
  result_summary?: string;
  duration_ms?: number;
  reasoning?: Reasoning[];
}

export interface TraceData {
  id: string;
  status: string;
  topic?: string;
  trace?: {
    steps: TraceStep[];
  };
}

interface TraceModalProps {
  traceData: TraceData;
  onClose: () => void;
}

export function TraceModal({ traceData, onClose }: TraceModalProps) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const handleExport = () => {
    navigator.clipboard.writeText(JSON.stringify(traceData, null, 2));
    alert("Copied to clipboard!"); // Note: requirements say "replacing the full page" for errors, not for simple clipboard copy but custom toast is disallowed.
  };

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const steps = traceData.trace?.steps || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-16 bg-[#000000]/80"
      onClick={onClose}
    >
      <div 
        className="modal-surface w-full max-w-[640px] rounded-[12px] p-32 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-24">
          <h2 className="font-600 text-20 text-text-primary">Reasoning Trace</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-20 leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-8">
          <div className="flex flex-col gap-16 font-mono text-14">
            {steps.map((step, index) => {
              const hasReasoning = step.reasoning && step.reasoning.length > 0;
              const isExpanded = expandedIndices.has(index);

              return (
                <div key={index} className="flex flex-col gap-8 pb-16 border-b border-border last:border-0 last:pb-0">
                  <div 
                    className={`flex items-center justify-between ${hasReasoning ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={() => hasReasoning && toggleExpand(index)}
                  >
                    <div className="flex items-center gap-8">
                      {hasReasoning && (
                        <span className="text-text-muted">{isExpanded ? '▼' : '▶'}</span>
                      )}
                      <span className={`text-text-primary ${!hasReasoning && 'ml-20'}`}>
                        {step.name} 
                        {step.status === 'active' && ' (Active)'}
                        {step.status === 'failed' && ' (Failed)'}
                      </span>
                    </div>
                    <div className="text-text-secondary text-12 text-right">
                      {step.result_summary && <span>{step.result_summary}</span>}
                      {step.duration_ms !== undefined && <span className="ml-8">• {(step.duration_ms / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>

                  {isExpanded && hasReasoning && (
                    <div className="flex flex-col gap-16 ml-20 mt-8">
                      {step.reasoning!.map((reason, rIdx) => (
                        <div key={rIdx} className="bg-background p-16 flex flex-col gap-8">
                          <div className="text-text-secondary text-12">Search Query</div>
                          <div className="text-text-primary">&ldquo;{reason.query}&rdquo;</div>
                          
                          <div className="text-text-secondary text-12 mt-8">Top Snippets</div>
                          <div className="flex flex-col gap-8">
                            {reason.snippets.map((snip, sIdx) => (
                              <div key={sIdx} className="border-l border-border pl-8 text-12">
                                <div className="text-text-primary">&ldquo;{snip.text}&rdquo;</div>
                                <div className="text-text-muted mt-4">— {snip.domain}</div>
                              </div>
                            ))}
                          </div>

                          <div className="text-text-secondary text-12 mt-8">Verdict Reasoning</div>
                          <div className="text-accent">{reason.explanation}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-24 flex justify-end">
          <button 
            type="button" 
            onClick={handleExport}
            className="text-text-primary font-500 text-14 hover:underline"
          >
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}
