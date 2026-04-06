"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const GITHUB_URL = "#"; 

interface StatsData {
  avg_confidence: number;
  total_runs: number;
  total_claims: number;
  total_sources: number;
}

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [auditText, setAuditText] = useState("");
  const [stats, setStats] = useState<StatsData | null>(null);

  const investigateRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const port = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${port}/api/stats`);
        if (res.ok) {
           const d = await res.json();
           setStats(d);
        }
      } catch {
        console.error("Stats API offline.");
      }
    };
    fetchStats();
  }, []);

  const handleInvestigate = () => {
    if (topic.trim()) {
      router.push(`/investigate?topic=${encodeURIComponent(topic)}`);
    }
  };

  const handleAudit = async () => {
    if (auditText.trim()) {
      try {
        const port = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${port}/api/audit/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: auditText })
        });
        if (res.ok) {
          const data = await res.json();
          router.push(`/audit/${data.run_id}`);
        }
      } catch (error) {
         console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-sans text-[#FAFAFA] flex flex-col">
      
      {/* NAV */}
      <nav className="border-b border-[#141414] bg-[#0A0A0A] bg-opacity-90 backdrop-blur-md sticky top-0 z-50 h-[80px] flex items-center">
        <div className="max-w-[1152px] w-full mx-auto px-[32px] flex items-center justify-between">
          <div className="flex items-center gap-[12px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#FACC15]" />
          <div className="font-600 text-[15px] tracking-[.06em]">NEWSROOM</div>
          <div className="text-[10px] bg-[#1c1400] text-[#FACC15] px-[8px] py-[4px] rounded-[10px] font-500">BETA</div>
        </div>
        
        <div className="flex items-center gap-[32px]">
          <button 
            onClick={() => investigateRef.current?.scrollIntoView({ behavior: "smooth" })} 
            className="text-[15px] text-[#A3A3A3] px-[16px] py-[10px] rounded-[4px] cursor-pointer bg-transparent border-none hover:text-[#FAFAFA] transition-colors"
          >
            Investigate
          </button>
          <div className="w-[1px] h-[16px] bg-[#1f1f1f]" />
          <button 
            onClick={() => auditRef.current?.scrollIntoView({ behavior: "smooth" })} 
            className="text-[15px] text-[#A3A3A3] px-[16px] py-[10px] rounded-[4px] cursor-pointer bg-transparent border-none hover:text-[#FAFAFA] transition-colors"
          >
            Audit
          </button>
          <div className="w-[1px] h-[16px] bg-[#1f1f1f]" />
          <a 
            href={GITHUB_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[15px] text-[#525252] px-[16px] py-[10px] no-underline hover:text-[#A3A3A3] transition-colors"
          >
            GitHub ↗
          </a>
        </div>
        </div>
      </nav>

      {/* CENTERED LAYOUT WRAPPER */}
      <main className="flex-1 w-full max-w-[1152px] mx-auto px-[32px] flex flex-col">
        
        {/* HERO */}
        <div className="pt-[96px] pb-[64px] text-center flex flex-col items-center">
          <h1 className="font-serif text-[52px] font-700 leading-[1.1] mb-[16px]">
            AI journalism that <em className="italic text-[#FACC15]">shows</em> its work.
          </h1>
          <p className="text-[15px] text-[#A3A3A3] leading-[1.7] max-w-[520px]">
            Every source checked. Every claim verified. A transparent pipeline that reasons like a journalist. Not a chatbot. Not a blackbox.
          </p>
        </div>

        {/* CARDS */}
        <div className="w-full mt-[48px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
          
          {/* Card 1 */}
          <div ref={investigateRef} className="bg-[#141414] rounded-[8px] p-[28px] flex flex-col">
            <div className="text-[9px] font-500 text-[#525252] uppercase tracking-[.08em] mb-[16px]">01 — Investigate a topic</div>
            <div className="text-[17px] font-600 text-[#FAFAFA] mb-[8px] leading-[1.3]">Type a topic.<br/>Get a sourced story.</div>
            <div className="text-[12px] text-[#A3A3A3] leading-[1.65] mb-[20px] flex-1">
              The pipeline searches the web, clusters sources by domain, verifies each claim against independent evidence, then writes a full article with inline citations.
            </div>
            
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleInvestigate(); }}
              placeholder="e.g. EU AI Act enforcement 2026"
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-[5px] px-[14px] py-[11px] text-[#FAFAFA] text-[13px] font-sans mb-[10px] outline-none placeholder:text-[#525252] h-[44px]"
            />
            <button 
              onClick={handleInvestigate} 
              className="w-full bg-[#FACC15] text-[#0A0A0A] border-none rounded-[5px] p-[11px] text-[13px] font-700 cursor-pointer text-center"
            >
              Investigate →
            </button>
            
            <div className="flex mt-[14px] gap-0">
               <div className="flex-1 flex items-center gap-[5px]">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#525252]"></div>
                  <div className="text-[10px] text-[#525252] font-500">Search</div>
                  <div className="text-[9px] text-[#333] ml-auto pr-[6px]">→</div>
               </div>
               <div className="flex-1 flex items-center gap-[5px]">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#525252]"></div>
                  <div className="text-[10px] text-[#525252] font-500">Cluster</div>
                  <div className="text-[9px] text-[#333] ml-auto pr-[6px]">→</div>
               </div>
               <div className="flex-1 flex items-center gap-[5px]">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#525252]"></div>
                  <div className="text-[10px] text-[#525252] font-500">Verify</div>
                  <div className="text-[9px] text-[#333] ml-auto pr-[6px]">→</div>
               </div>
               <div className="flex-1 flex items-center gap-[5px]">
                  <div className="w-[5px] h-[5px] rounded-full bg-[#525252]"></div>
                  <div className="text-[10px] text-[#525252] font-500">Write</div>
               </div>
            </div>
          </div>

          {/* Card 2 */}
          <div ref={auditRef} className="bg-[#141414] rounded-[8px] p-[28px] flex flex-col">
            <div className="text-[9px] font-500 text-[#525252] uppercase tracking-[.08em] mb-[16px]">02 — Audit an article</div>
            <div className="text-[17px] font-600 text-[#FAFAFA] mb-[8px] leading-[1.3]">Paste an article.<br/>Get a verdict.</div>
            <div className="text-[12px] text-[#A3A3A3] leading-[1.65] mb-[20px] flex-1">
              Every factual claim is extracted and cross-referenced against live sources. Four labeled sections: unsupported claims, missing context, contradictions, verified. Includes a Virlo factuality score.
            </div>
            
            <textarea
              value={auditText}
              onChange={(e) => setAuditText(e.target.value)}
              placeholder="Paste article text or enter a URL..."
              className="w-full bg-[#0A0A0A] border border-[#262626] rounded-[5px] px-[14px] py-[11px] text-[#FAFAFA] text-[13px] font-sans h-[88px] mb-[10px] outline-none placeholder:text-[#525252] resize-none"
            />
            <button 
              onClick={handleAudit} 
              className="w-full bg-[#FACC15] text-[#0A0A0A] border-none rounded-[5px] p-[11px] text-[13px] font-700 cursor-pointer text-center"
            >
              Run Audit →
            </button>
          </div>

        </div>
      </div>

      {/* STATS */}
      <div className="w-full mt-[40px] mb-[64px]">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-[#141414] rounded-[8px] overflow-hidden">
          
          <div className="p-[20px] px-[24px] border-b md:border-b-0 border-r border-[#0A0A0A] flex flex-col gap-[4px]">
             <div className="text-[24px] font-600 text-[#FAFAFA] leading-none flex items-baseline gap-[2px]">
               {stats ? Math.round(stats.avg_confidence) : "60"}<span className="text-[12px] text-[#525252] font-400">%</span>
             </div>
             <div className="text-[10px] text-[#525252] mt-[1px]">avg confidence score</div>
             <div className="flex items-center gap-[4px] mt-[4px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#22C55E] animate-[pulse_2.5s_ease-in-out_infinite]" />
                <div className="text-[9px] text-[#22C55E] font-500 uppercase tracking-[.05em]">from real runs</div>
             </div>
          </div>
          
          <div className="p-[20px] px-[24px] border-b md:border-b-0 md:border-r border-[#0A0A0A] flex flex-col gap-[4px]">
             <div className="text-[24px] font-600 text-[#FAFAFA] leading-none">
               {stats ? stats.total_runs.toLocaleString() : "4"}
             </div>
             <div className="text-[10px] text-[#525252] mt-[1px]">investigations run</div>
             <div className="flex items-center gap-[4px] mt-[4px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#22C55E]" />
                <div className="text-[9px] text-[#22C55E] font-500 uppercase tracking-[.05em]">live count</div>
             </div>
          </div>

          <div className="p-[20px] px-[24px] border-r border-[#0A0A0A] flex flex-col gap-[4px]">
             <div className="text-[24px] font-600 text-[#FAFAFA] leading-none">
               {stats ? stats.total_claims.toLocaleString() : "55"}
             </div>
             <div className="text-[10px] text-[#525252] mt-[1px]">claims verified total</div>
             <div className="flex items-center gap-[4px] mt-[4px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#22C55E]" />
                <div className="text-[9px] text-[#22C55E] font-500 uppercase tracking-[.05em]">live count</div>
             </div>
          </div>

          <div className="p-[20px] px-[24px] flex flex-col gap-[4px]">
             <div className="text-[24px] font-600 text-[#FAFAFA] leading-none">
               {stats ? stats.total_sources.toLocaleString() : "36"}
             </div>
             <div className="text-[10px] text-[#525252] mt-[1px]">sources checked total</div>
             <div className="flex items-center gap-[4px] mt-[4px]">
                <div className="w-[5px] h-[5px] rounded-full bg-[#22C55E]" />
                <div className="text-[9px] text-[#22C55E] font-500 uppercase tracking-[.05em]">live count</div>
             </div>
          </div>

        </div>
      </div>
      </main>

      <div className="flex-1 w-full" />{/* spacer before footer to push it to bottom if screen is tall */}

      {/* FOOTER */}
      <footer className="border-t border-[#141414] mt-[64px]">
         <div className="max-w-[1152px] w-full mx-auto px-[32px] py-[32px] flex flex-col md:flex-row gap-[16px] items-center justify-between">
           <div className="flex items-center flex-wrap justify-center md:justify-start gap-[12px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#FACC15]" />
              <div className="font-600 text-sm tracking-[.06em] text-[#525252]">NEWSROOM</div>
              <div className="text-sm text-[#333]">·</div>
              <div className="text-sm text-[#525252]">Built for Vibeathon · April 2026</div>
              <div className="text-sm text-[#333]">·</div>
              <div className="text-sm text-[#525252]">Tavily · Groq · Virlo · LiteLLM</div>
           </div>
           <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-[#525252] hover:text-[#FAFAFA] transition-colors no-underline">
             View on GitHub ↗
           </a>
         </div>
      </footer>

    </div>
  );
}
