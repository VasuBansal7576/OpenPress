"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StepIndicator, StepState } from "@/components/StepIndicator";
import { getApiBaseUrl } from "@/lib/api";

interface StepData {
  id: string;
  name: string;
  descriptionActive: string;
  state: StepState;
  resultSummary?: string;
  durationMs?: number;
  errorMessage?: string;
}

const INITIAL_STEPS: StepData[] = [
  { id: "extract", name: "Extracting Claims", descriptionActive: "Parsing article text for facts (max 15)...", state: "pending" },
  { id: "verify", name: "Verifying Claims", descriptionActive: "Checking claims against web sources...", state: "pending" },
  { id: "virlo", name: "Virlo Fact-Check", descriptionActive: "Calling Virlo API...", state: "pending" },
  { id: "score", name: "Calculating Confidence", descriptionActive: "Applying domain independence rules...", state: "pending" },
];

function AuditProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const text = searchParams.get("text") || "";
  const apiBaseUrl = getApiBaseUrl();
  
  const [steps, setSteps] = useState<StepData[]>(INITIAL_STEPS);
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    const startRun = async () => {
      try {
        // To build the UI quickly, we simulate the start endpoint behavior here if needed,
        // but let's assume there's a real API or we just use a fake run ID for now.
        const res = await fetch(`${apiBaseUrl}/api/audit/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }).catch(() => null);

        // Fallback for simulation until Step 6 incorporates Audit APIs
        if (!res || !res.ok) {
          console.warn("Backend not ready for Audit, using mocked flow");
          setRunId("mock-audit-id");
          return;
        }
        
        const data = await res.json();
        setRunId(data.run_id);
      } catch (err) {
        console.error("Start run error:", err);
      }
    };
    startRun();
  }, [apiBaseUrl, text]);

  useEffect(() => {
    if (!runId) return;

    if (runId === "mock-audit-id") {
      // Mock progression
      let currentStep = 0;
      const interval = setInterval(() => {
        setSteps(prev => {
          const next = [...prev];
          if (currentStep > 0 && currentStep <= next.length) {
            next[currentStep - 1].state = "complete";
            next[currentStep - 1].resultSummary = "Done";
            next[currentStep - 1].durationMs = 1200;
          }
          if (currentStep < next.length) {
            next[currentStep].state = "active";
          }
          return next;
        });
        currentStep++;
        if (currentStep > INITIAL_STEPS.length) {
          clearInterval(interval);
          setTimeout(() => router.push(`/audit/mock-result`), 600);
        }
      }, 1500);
      return () => clearInterval(interval);
    }

    // Real polling
    let timeoutId: NodeJS.Timeout;
    const pollStatus = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/audit/status/${runId}`);
        if (!res.ok) throw new Error("Failed to poll status");
        const data = await res.json();
        
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

        if (data.status === "finished") {
          timeoutId = setTimeout(() => router.push(`/audit/${runId}`), 600);
          return;
        }

        timeoutId = setTimeout(pollStatus, 500);
      } catch (err) {
        console.error(err);
      }
    };
    pollStatus();
    return () => clearTimeout(timeoutId);
  }, [apiBaseUrl, runId, router]);

  return (
    <main className="min-h-screen px-24 py-32 flex flex-col max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-48 border-b border-border pb-16">
        <div className="font-500 text-16 text-text-primary capitalize break-words pr-16 truncate max-w-md">
          {text.slice(0, 50)}...
        </div>
        <Link href="/" className="font-500 text-14 text-text-secondary hover:text-text-primary shrink-0">
          Cancel
        </Link>
      </header>

      <section className="flex flex-col gap-16 max-w-2xl">
        {steps.map((step) => (
          <StepIndicator key={step.id} {...step} />
        ))}
      </section>
    </main>
  );
}

export default function AuditProgressScreen() {
  return (
    <Suspense fallback={<div className="p-32 text-text-secondary">Loading...</div>}>
      <AuditProgressContent />
    </Suspense>
  );
}
