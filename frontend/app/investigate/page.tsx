"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type StepState = "pending" | "active" | "complete" | "failed";

interface StepData {
  id: string;
  name: string;
  descriptionActive: string;
  state: StepState;
  resultSummary?: string;
  durationMs?: number;
  errorMessage?: string;
}

interface TraceStepResponse {
  status: StepState;
  result_summary?: string;
  duration_ms?: number;
}

interface InvestigationStatusResponse {
  status?: "created" | "failed" | "finished" | "running";
  error_message?: string;
  trace?: {
    steps?: TraceStepResponse[];
  };
}

const INITIAL_STEPS: StepData[] = [
  { id: "search", name: "Signal Search", descriptionActive: "Crawling indices (Tavily, SearXNG)...", state: "pending" },
  { id: "cluster", name: "Clustering Constraints", descriptionActive: "Analyzing root domain isolation...", state: "pending" },
  { id: "verify", name: "Cross-Verification", descriptionActive: "LLM agent dynamically computing claim ratios...", state: "pending" },
  { id: "story", name: "Narrative Engine", descriptionActive: "Applying editorial reasoning formatting...", state: "pending" },
];

function TerminalStep({ step, index }: { step: StepData, index: number }) {
  const { state, name, descriptionActive, resultSummary, durationMs, errorMessage } = step;

  if (state === "pending") return null; // Progressive disclosure: only show what we've reached

  return (
    <div className="flex flex-col gap-4 py-8 border-l border-[#262626] pl-16 relative">
      {/* Timeline Node */}
      <div className="absolute left-[-5px] top-[14px]">
        {state === "active" && <div className="w-[9px] h-[9px] rounded-full bg-accent animate-pulse-fast shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>}
        {state === "complete" && <div className="w-[9px] h-[9px] rounded-full bg-success"></div>}
        {state === "failed" && <div className="w-[9px] h-[9px] rounded-full bg-error"></div>}
      </div>

      <div className="flex items-baseline justify-between gap-16">
         <span className={`font-mono text-[11px] uppercase tracking-widest font-600 ${state === 'active' ? 'text-text-primary' : 'text-text-secondary'}`}>
            [{index + 1}/4] {name}
         </span>
         {durationMs !== undefined && (
            <span className="font-mono text-[10px] text-text-muted bg-[#141414] px-6 py-2 rounded-[2px]">
              {(durationMs / 1000).toFixed(1)}s
            </span>
         )}
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {state === "active" && (
           <div className="text-[14px] text-text-muted animate-pulse font-sans">
              {descriptionActive}
           </div>
        )}
        {state === "complete" && (
           <div className="text-[14px] text-text-primary font-sans leading-[1.6]">
              {resultSummary}
           </div>
        )}
        {state === "failed" && (
           <div className="text-[14px] text-error font-sans bg-[#2a0e0e] border border-[#ef4444] p-12 mt-4 rounded-[4px]">
              {errorMessage || "Execution aborted due to upstream fault."}
           </div>
        )}
      </div>
    </div>
  );
}

function InvestigateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "Unknown Topic";
  
  const [steps, setSteps] = useState<StepData[]>(INITIAL_STEPS);
  const [runId, setRunId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Start run
    const startRun = async () => {
      try {
        const port = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${port}/api/investigate/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) throw new Error("Failed to start investigation");
        const data = await res.json();
        setRunId(data.run_id);
      } catch (err: unknown) {
        console.error("Start run error:", err);
        setErrorMsg(err instanceof Error ? err.message : "Failed to establish uplink to execution engine.");
      }
    };
    startRun();
  }, [topic]);

  useEffect(() => {
    if (!runId) return;

    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const port = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${port}/api/investigate/status/${runId}`);
        if (!res.ok) throw new Error("Failed to poll trace context");
        const data: InvestigationStatusResponse = await res.json();
        
        const traceSteps = data.trace?.steps || [];
        setSteps((prev) => 
          prev.map((step, idx) => {
            const traceStep = traceSteps[idx];
            if (!traceStep) return step;
            return {
              ...step,
              state: traceStep.status,
              resultSummary: traceStep.result_summary,
              durationMs: traceStep.duration_ms,
            };
          })
        );

        if (data.status === "failed") {
            setErrorMsg(data.error_message || "API rate limit encountered in inference layer.");
            return;
        }

        if (data.status === "finished") {
          timeoutId = setTimeout(() => {
            router.push(`/story/${runId}`);
          }, 800); // Give user a moment to see completion before jumping
          return;
        }

        timeoutId = setTimeout(pollStatus, 500);
      } catch (err) {
        console.error("Poll status error:", err);
      }
    };

    pollStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [runId, router]);

  const hasFailed = steps.some(s => s.state === 'failed') || errorMsg;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <nav className="border-b border-[#141414] mb-32 h-[80px] flex items-center">
        <div className="max-w-[1152px] w-full mx-auto px-[32px] flex items-center justify-between">
          <div className="flex items-center gap-12">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#A3A3A3] bg-[#141414] px-[12px] py-[6px] rounded-[3px]">
                Task
              </div>
              <span className="text-[15px] text-[#FAFAFA] font-500 truncate max-w-xs sm:max-w-md">
                {topic}
              </span>
          </div>
          <Link href="/" className="text-[15px] text-[#525252] hover:text-[#FAFAFA] transition-colors px-[16px] py-[10px]">
            Abort
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start px-[32px] pt-[64px]">
        <div className="w-full max-w-[760px] flex flex-col bg-[#080808] border border-[#141414] rounded-[5px] overflow-hidden">
          
          <div className="px-16 py-12 bg-[#101010] border-b border-[#141414] flex items-center justify-between">
             <div className="font-mono text-[10px] uppercase text-text-secondary tracking-widest">Pipeline Execution Trace</div>
             <div className="flex gap-[4px] items-center">
                <div className={`w-[6px] h-[6px] rounded-full ${hasFailed ? 'bg-error' : 'bg-success animate-pulse'}`}></div>
                <div className="font-mono text-[9px] uppercase text-text-muted tracking-widest ml-4">System OK</div>
             </div>
          </div>

          <div className="p-24 flex flex-col gap-8 min-h-[300px]">
            {steps.map((step, idx) => (
              <TerminalStep key={step.id} step={step} index={idx} />
            ))}
            
            {/* Initial Boot state if nothing is active yet */}
            {steps.every(s => s.state === 'pending') && !errorMsg && (
                <div className="text-[13px] font-mono text-text-muted animate-pulse">Initializing execution context...</div>
            )}

            {hasFailed && errorMsg && (
              <div className="mt-auto pt-32">
                 <div className="bg-[#1a0a0a] border border-error p-16 rounded-[4px] flex flex-col gap-12">
                    <span className="font-mono text-[10px] text-error uppercase tracking-widest">Critical Fault</span>
                    <span className="text-[13px] text-text-primary">{errorMsg}</span>
                    <Link href="/" className="text-error text-[12px] underline mt-8 self-start">Return to Base</Link>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }
        @keyframes pulse-fast { 
          0%, 100% { opacity: 1 } 
          50% { opacity: .2 } 
        }
      `}</style>
    </div>
  );
}

export default function InvestigateScreen() {
  return (
    <Suspense fallback={<div className="p-32 text-text-muted font-mono text-[11px] uppercase">Booting subsystem...</div>}>
      <InvestigateContent />
    </Suspense>
  );
}
