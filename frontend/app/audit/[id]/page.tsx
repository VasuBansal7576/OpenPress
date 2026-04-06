"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TraceModal, TraceData } from "@/components/TraceModal";
import { getApiBaseUrl } from "@/lib/api";

interface AuditIssue {
  type: string;
  claim: string;
  explanation: string;
}

interface AuditReportData extends TraceData {
  confidence?: number;
  topic?: string;
  issues?: AuditIssue[];
  virlo_score?: number;
}

export default function AuditReportScreen() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();

  const [data, setData] = useState<AuditReportData | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/audit/status/${id}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (id) fetchData();
  }, [apiBaseUrl, id]);

  if (!data) return <div className="p-32 text-text-secondary font-sans text-[13px]">Loading audit context...</div>;

  const truncateId = data.topic ? `${data.topic.slice(0, 30)}...` : `Report-${id.slice(0, 8)}`;
  
  const issues = data.issues || [];
  const unsupported = issues.filter((i: AuditIssue) => i.type === "unsupported");
  const missingContext = issues.filter((i: AuditIssue) => i.type === "missing_context");
  const contradictions = issues.filter((i: AuditIssue) => i.type === "contradiction");
  const verified = issues.filter((i: AuditIssue) => i.type === "verified");

  const score = data.confidence || 0;
  const scoreColor = score >= 75 ? "text-accent" : score >= 50 ? "text-warning" : "text-error";

  const getCountText = (count: number, unitSingular: string, unitPlural: string) => 
    `${count} ${count === 1 ? unitSingular : unitPlural}`;

  return (
    <>
      <main className="min-h-screen bg-background font-sans pb-[100px]">
        {/* Top Bar */}
        <nav className="border-b border-[#141414] bg-background h-[80px] flex items-center">
          <div className="max-w-[1152px] w-full mx-auto px-[32px] flex items-center justify-between">
            <div className="font-mono text-[12px] uppercase tracking-widest text-[#A3A3A3]">{truncateId}</div>
            <button 
              type="button" 
              onClick={() => router.push("/")}
              className="font-600 text-[12px] uppercase tracking-widest text-[#525252] hover:text-[#FAFAFA] transition-colors cursor-pointer bg-transparent border-none px-[16px] py-[10px]"
            >
              ← System Reboot
            </button>
          </div>
        </nav>

        <article className="max-w-[1152px] mx-auto px-[32px] py-[64px]">
          
          {/* Header Score Display (Structural Reasoning Update) */}
          <div className="bg-[#101010] border border-[#141414] rounded-[6px] p-32 mb-64 flex flex-col md:flex-row gap-48 justify-between items-start md:items-center">
             
             <div className="flex flex-col gap-12">
               <div className="text-[10px] text-text-muted font-mono uppercase tracking-widest bg-[#141414] self-start px-8 py-4 rounded-[2px] border border-[#1f1f1f]">
                  Audit Evaluation
               </div>
               <div className="flex items-baseline gap-12 mt-8">
                  <span className={`text-[64px] font-600 leading-none tracking-tight ${scoreColor}`}>{score}</span>
                  <span className="text-[20px] text-text-secondary">%</span>
               </div>
               <div className="text-[13px] font-500 text-text-primary mt-4">Calculated Confidence Quotient</div>
             </div>
             
             {/* Dynamic Structured Reasoning Block */}
             <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-16 border-l border-[#262626] font-mono pl-0 md:pl-32 border-l-0 md:border-l-[1px]">
                <div className="flex flex-col gap-4">
                   <span className="text-[10px] uppercase tracking-widest text-text-muted">Total Statements Processed</span>
                   <span className="text-[13px] text-text-primary">{issues.length} independent semantic claims</span>
                </div>
                <div className="flex flex-col gap-4">
                   <span className="text-[10px] uppercase tracking-widest text-text-muted">Verification Vector</span>
                   <span className="text-[13px] text-text-primary">{verified.length} claims cleared threshold</span>
                </div>
                <div className="flex items-center gap-16 border-t border-[#1f1f1f] pt-16 mt-8">
                   {data.virlo_score !== undefined && (
                     <div className="flex flex-col gap-4">
                        <span className="text-[9px] text-[#525252] uppercase tracking-widest font-600">Virlo Node</span>
                        <span className="text-[13px] font-600 text-text-primary">{data.virlo_score}/100</span>
                     </div>
                   )}
                   <button 
                     onClick={() => setShowTrace(true)}
                     className="ml-auto text-[10px] font-600 text-accent uppercase tracking-widest hover:text-[#FAFAFA] transition-colors"
                   >
                     View Graph →
                   </button>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-8 mb-24">
             <div className="w-[4px] h-[16px] bg-accent"></div>
             <h2 className="font-sans font-600 text-[14px] text-text-primary uppercase tracking-widest">Discrete Audit Blocks</h2>
          </div>

          <div className="flex flex-col gap-32">

            {/* UNSUPPORTED CLAIMS */}
            <div className="bg-[#0A0A0A] border-[2px] border-error rounded-[5px] overflow-hidden">
              <div className="bg-[#140808] px-24 py-16 flex items-center justify-between border-b border-error">
                <div className="flex items-center gap-8">
                   <div className="text-[12px] font-600 uppercase tracking-widest text-error">Critical: Unsupported</div>
                </div>
                <div className="text-[11px] font-mono text-error">{getCountText(unsupported.length, "node", "nodes")}</div>
              </div>
              <div className="p-24 flex flex-col gap-24">
                {unsupported.length === 0 ? (
                  <div className="text-[13px] font-mono text-text-muted">No isolated claims failed verification constraint.</div>
                ) : (
                  unsupported.map((item: AuditIssue, idx: number) => (
                    <div key={idx} className="flex flex-col gap-8">
                       <div className="text-[14px] font-serif leading-[1.6]">
                          <span className="font-600 text-text-primary">&ldquo;{item.claim}&rdquo;</span>
                       </div>
                       <div className="text-[12px] font-mono text-text-muted mt-4 p-12 bg-[#0d0d0d] border border-[#1a1a1a] rounded-[2px]">
                          &gt; {item.explanation}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CONTRADICTIONS */}
            <div className="bg-[#0A0A0A] border-[2px] border-accent rounded-[5px] overflow-hidden opacity-90">
              <div className="bg-[#1a1705] px-24 py-16 flex items-center justify-between border-b border-accent">
                <div className="flex items-center gap-8">
                   <div className="text-[12px] font-600 uppercase tracking-widest text-accent">Fault: Contradictions</div>
                </div>
                <div className="text-[11px] font-mono text-accent">{getCountText(contradictions.length, "node", "nodes")}</div>
              </div>
              <div className="p-24 flex flex-col gap-32">
                {contradictions.length === 0 ? (
                  <div className="text-[13px] font-mono text-text-muted">No reality-inconsistent fragments detected.</div>
                ) : (
                  contradictions.map((item: AuditIssue, idx: number) => (
                    <div key={idx} className="flex flex-col gap-16">
                       <div className="text-[14px] font-serif leading-[1.5] text-text-primary">
                          &ldquo;{item.claim}&rdquo;
                       </div>
                       <div className="flex flex-col sm:flex-row gap-0 rounded-[4px] overflow-hidden border border-[#262626]">
                          <div className="flex-1 bg-[#0d0d0d] p-16 flex flex-col gap-8 border-r border-[#262626]">
                            <span className="text-[9px] uppercase tracking-widest font-600 text-text-muted">Parsed Claim</span>
                            <span className="text-[13px] font-serif text-text-secondary leading-[1.5]">{item.claim}</span>
                          </div>
                          <div className="flex-1 bg-[#141414] p-16 flex flex-col gap-8">
                            <span className="text-[9px] uppercase tracking-widest font-600 text-accent">External Fact (Ground Truth)</span>
                            <span className="text-[13px] font-serif text-text-primary leading-[1.5]">{item.explanation}</span>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MISSING CONTEXT */}
            <div className="bg-[#0A0A0A] border border-[#262626] rounded-[5px] overflow-hidden opacity-80">
              <div className="bg-[#141414] px-24 py-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <div className="text-[12px] font-600 uppercase tracking-widest text-warning">Warning: Missing Context</div>
                </div>
                <div className="text-[11px] font-mono text-warning">{getCountText(missingContext.length, "node", "nodes")}</div>
              </div>
              <div className="p-24 flex flex-col gap-24">
                {missingContext.length === 0 ? (
                  <div className="text-[13px] font-mono text-text-muted">No context omissions detected.</div>
                ) : (
                  missingContext.map((item: AuditIssue, idx: number) => (
                    <div key={idx} className="flex flex-col gap-8">
                       <div className="text-[14px] font-serif">
                          <span className="font-600 text-text-primary">&ldquo;{item.claim}&rdquo;</span>
                       </div>
                       <div className="text-[13px] font-serif text-text-secondary leading-[1.6]">
                          <span className="text-warning mr-8 font-mono">↳</span>{item.explanation}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* VERIFIED CLAIMS */}
            <div className="bg-[#0A0A0A] border border-[#1a2f1d] rounded-[5px] overflow-hidden opacity-70">
              <div className="bg-[#08120a] px-24 py-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                   <div className="text-[12px] font-600 uppercase tracking-widest text-success">Cleared: Verified</div>
                </div>
                <div className="text-[11px] font-mono text-success">{getCountText(verified.length, "node", "nodes")}</div>
              </div>
              <div className="p-24 flex flex-col gap-24">
                {verified.length === 0 ? (
                  <div className="text-[13px] font-mono text-text-muted">No claims resolved against authority indices.</div>
                ) : (
                  verified.map((item: AuditIssue, idx: number) => (
                    <div key={idx} className="flex items-start gap-16">
                       <div className="text-[14px] text-success font-600 leading-[1.5] mt-2">✓</div>
                       <div className="flex flex-col gap-8">
                         <div className="text-[14px] font-serif text-text-primary">
                            &ldquo;{item.claim}&rdquo;
                         </div>
                         <div className="text-[12px] font-serif text-text-secondary leading-[1.5]">
                            {item.explanation}
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </article>
      </main>

      {showTrace && <TraceModal traceData={data as TraceData} onClose={() => setShowTrace(false)} />}
    </>
  );
}
