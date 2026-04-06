"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TraceModal, TraceData } from "@/components/TraceModal";
import { SourcesModal, type Source } from "@/components/SourcesModal";
import { getApiBaseUrl } from "@/lib/api";

type StorySource = Source;

interface StorySection {
  heading: string;
  body: string;
}

interface ClaimEvaluation {
  claim: string;
}

interface StoryData extends TraceData {
  sources?: StorySource[];
  sections?: StorySection[];
  headline?: string;
  summary?: string;
  confidence?: number;
  trace?: TraceData["trace"] & {
    claims_evaluated?: ClaimEvaluation[];
  };
}

export default function StoryScreen() {
  const params = useParams();
  const id = params.id as string;
  const apiBaseUrl = getApiBaseUrl();
  
  const [data, setData] = useState<StoryData | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/investigate/status/${id}`);
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

  if (!data) return <div className="p-32 text-[#A3A3A3] font-sans text-[13px]">Loading story...</div>;

  const sources = data.sources || [];
  const sortedSources = [...sources].sort((a: StorySource, b: StorySource) => (b.relevance || 0) - (a.relevance || 0));
  const highRelevance = sortedSources.filter((s: StorySource) => (s.relevance || 0) >= 0.85);
  const supporting = sortedSources.filter((s: StorySource) => (s.relevance || 0) < 0.85);

  const sections = data.sections || [];
  const headline = data.headline || data.topic || "Unknown Topic";
  const summary = data.summary || "";
  const confidence = data.confidence || 0;
  
  const scoreColor = confidence >= 75 ? "text-[#FACC15]" : confidence >= 50 ? "text-[#F97316]" : "text-[#EF4444]";

  const getDots = (relevance: number) => {
    const count = relevance >= 0.85 ? 3 : relevance >= 0.5 ? 2 : 1;
    return (
      <div className="flex gap-[4px] mt-2">
         {[1, 2, 3].map((num) => (
            <div key={num} className={`w-[5px] h-[5px] rounded-full ${num <= count ? 'bg-[#FACC15]' : 'bg-[#262626]'}`}></div>
         ))}
      </div>
    );
  };

  const renderParagraphs = (bodyText: string) => {
    return bodyText.split('\n').filter(p => p.trim() !== '').map((p, pIdx) => {
      
      const textWithCitations = p.split(/(\[\d+\])/g).map((segment, idx) => {
         const match = segment.match(/\[(\d+)\]/);
         if (match) {
           return (
             <sup 
                 key={idx} 
                 className="text-[9px] text-[#FACC15] font-sans ml-[2px] tracking-wider"
             >
               {match[1]}
             </sup>
           );
         }
         return <span key={idx}>{segment}</span>;
      });

      return (
        <p 
          key={pIdx} 
          style={{ fontFamily: "'Lora', Georgia, serif" }} 
          className="text-[15px] leading-[1.95] text-[#FAFAFA] mb-[24px] opacity-90"
        >
          {textWithCitations}
        </p>
      );
    });
  };

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] font-sans text-[#FAFAFA] flex flex-col">
        
        {/* NAV */}
        <nav className="border-b border-[#141414] h-[80px] flex items-center">
          <div className="max-w-[1240px] w-full mx-auto px-[32px] flex items-center justify-between">
            <Link href="/" className="text-[15px] text-[#525252] hover:text-[#FAFAFA] transition-colors flex items-center gap-[10px] font-500 px-[16px] py-[10px]">
              ← New investigation
            </Link>
            <div className="flex items-center bg-[#141414] rounded-[24px] px-[16px] py-[6px] gap-[8px]">
               <span className={`text-[13px] font-600 ${scoreColor}`}>{confidence}%</span>
               <span className="text-[11px] text-[#525252]">confidence</span>
            </div>
          </div>
        </nav>

        {/* TWO COLUMN LAYOUT */}
        <main className="flex-1 flex max-w-[1240px] mx-auto w-full">
          
          {/* ARTICLE COLUMN */}
          <article className="flex-1 px-[48px] py-[48px] max-w-[760px]">
             
             <div className="flex items-center gap-[12px] mb-[32px]">
                <span className="bg-[#141414] px-[8px] py-[4px] text-[9px] font-500 uppercase tracking-widest text-[#A3A3A3]">Investigation</span>
                <span className="text-[11px] text-[#525252] font-mono">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
             </div>

             <h1 
               style={{ fontFamily: "'Lora', Georgia, serif" }} 
               className="text-[26px] font-700 leading-[1.3] text-[#FAFAFA] mb-[24px]"
             >
               {headline}
             </h1>
             
             <p 
               style={{ fontFamily: "'Lora', Georgia, serif" }} 
               className="text-[17px] leading-[1.8] text-[#A3A3A3] pb-[32px] mb-[48px] border-b border-[#141414]"
             >
               {summary}
             </p>

             <div className="flex flex-col gap-[48px]">
               {sections.length > 0 ? sections.map((section: StorySection, idx: number) => (
                 <div key={idx} className="flex flex-col gap-[12px]">
                   <h2 className="font-sans font-700 text-[10px] uppercase text-[#525252] tracking-widest mb-[8px]">
                     {section.heading}
                   </h2>
                   <div className="flex flex-col">
                     {renderParagraphs(section.body)}
                   </div>
                   
                   {/* Injected Pull Quote exactly after the first section */}
	                   {idx === 0 && data.trace?.claims_evaluated?.[0] && (
	                      <div className="border-l-[2px] border-[#FACC15] bg-[#111111] p-[12px_16px] rounded-[0_6px_6px_0] my-[24px] mx-0 sm:-mx-[24px]">
	                        <p style={{ fontFamily: "'Lora', Georgia, serif" }} className="italic text-[16px] leading-[1.9] text-[#A3A3A3] mb-[8px]">
	                          &ldquo;{data.trace.claims_evaluated[0].claim}&rdquo;
	                        </p>
                        <div className="font-sans text-[10px] text-[#525252]">System Verification Engine</div>
                      </div>
                   )}
                 </div>
               )) : (
                 <p style={{ fontFamily: "'Lora', Georgia, serif" }} className="text-[14px] text-[#A3A3A3]">Report content could not be found.</p>
               )}
             </div>

          </article>

          {/* SIDEBAR COLUMN */}
          <aside className="w-[300px] shrink-0 border-l border-[#141414] bg-[#0d0d0d] p-[32px] hidden md:flex flex-col min-h-full">
             
             <div className="mb-[16px] flex flex-col items-start w-full">
                <div className="flex items-baseline gap-[4px] mb-[4px]">
                   <span className={`text-[44px] font-700 leading-none font-sans tracking-tight ${scoreColor}`}>{confidence}</span>
                   <span className="text-[16px] text-[#A3A3A3]">%</span>
                </div>
                <div className="text-[9px] text-[#525252] uppercase tracking-widest font-600 mb-[16px]">confidence</div>
                
                {/* Score Breakdown */}
                <div className="w-full bg-[#141414] p-[16px] rounded-[4px] border border-[#1f1f1f] flex flex-col gap-[12px]">
                   <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#A3A3A3]">Unique Domains</span>
                      <span className="font-mono text-[11px] text-[#FAFAFA] font-600">{new Set(sources.map((s: StorySource) => s.domain)).size}</span>
                   </div>
                   <div className="w-full h-[1px] bg-[#1f1f1f]"></div>
                   <div className="flex justify-between items-center">
                      <span className="text-[11px] text-[#A3A3A3]">Verified Claims</span>
                      <span className="font-mono text-[11px] text-[#FAFAFA] font-600">
                        {data.trace?.steps?.[2]?.result_summary?.match(/\d+/)?.[0] || data.trace?.claims_evaluated?.length || "Unknown"}
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex flex-col mb-[48px] overflow-y-auto w-full">
                <h3 className="text-[10px] uppercase tracking-widest font-600 text-[#525252] mb-[24px]">Sources</h3>
                
                {/* High Relevance Group */}
                {highRelevance.length > 0 && (
                   <div className="mb-[24px]">
                      <div className="text-[9px] uppercase tracking-widest text-[#525252] mb-[12px] flex items-center gap-[6px]">
                         Primary Nodes
                      </div>
                      <div className="flex flex-col gap-[16px] border-l border-[#262626] ml-[4px] pl-[12px]">
                         {highRelevance.slice(0, 4).map((src: StorySource, idx: number) => (
                            <div key={`hr-${idx}`} className="flex flex-col gap-[4px] w-full">
                               <span className="text-[11px] font-600 text-[#FAFAFA] line-clamp-1">{src.domain}</span>
                               {getDots(src.relevance || 0)}
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Supporting Group */}
                {supporting.length > 0 && (
                   <div>
                      <div className="text-[9px] uppercase tracking-widest text-[#525252] mb-[12px] flex items-center gap-[6px]">
                         Supporting
                      </div>
                      <div className="flex flex-col gap-[16px] border-l border-[#262626] ml-[4px] pl-[12px]">
                         {supporting.slice(0, 5).map((src: StorySource, idx: number) => (
                            <div key={`sup-${idx}`} className="flex flex-col gap-[4px] w-full">
                               <span className="text-[11px] font-600 text-[#FAFAFA] line-clamp-1">{src.domain}</span>
                               {getDots(src.relevance || 0)}
                            </div>
                         ))}
                         {supporting.length > 5 && (
                           <div className="text-[10px] font-mono text-[#525252] tracking-widest mt-[4px]">+{supporting.length - 5} MORE</div>
                         )}
                      </div>
                   </div>
                )}
             </div>

             <div className="flex flex-col gap-[8px] mt-auto w-full">
                <button 
                  onClick={() => setShowTrace(true)}
                  className="w-full h-[36px] flex items-center justify-center bg-transparent border border-[#333] text-[#FAFAFA] text-[11px] font-600 uppercase tracking-widest rounded-[3px] transition-colors hover:bg-[#141414]"
                >
                  View Trace
                </button>
                <button 
                  onClick={() => setShowSources(true)}
                  className="w-full h-[36px] flex items-center justify-center bg-transparent border border-[#262626] text-[#FAFAFA] text-[11px] font-600 uppercase tracking-widest rounded-[3px] transition-colors hover:bg-[#141414]"
                >
                  View Sources
                </button>
             </div>
          </aside>

        </main>
      </div>

      {showTrace && <TraceModal traceData={data as TraceData} onClose={() => setShowTrace(false)} />}
      {showSources && <SourcesModal sources={sources} onClose={() => setShowSources(false)} />}
    </>
  );
}
