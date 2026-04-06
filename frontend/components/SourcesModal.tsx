import React from "react";

export interface Source {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  relevance?: number;
}

interface SourcesModalProps {
  sources: Source[];
  onClose: () => void;
}

export function SourcesModal({ sources, onClose }: SourcesModalProps) {
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
          <h2 className="font-600 text-20 text-text-primary">Cited Sources</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-20 leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-8">
          <div className="flex flex-col gap-24">
            {sources.map((source, index) => (
              <div key={index} className="flex gap-16">
                <div className="text-text-muted font-500 text-16 min-w-[24px]">
                  {index + 1}.
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-500 text-16 text-text-primary hover:text-accent underline decoration-1 underline-offset-4"
                  >
                    {source.title}
                  </a>
                  <div className="flex items-center gap-8 text-12 text-text-secondary">
                    <span>{source.domain}</span>
                    {source.relevance !== undefined && (
                      <>
                        <span>•</span>
                        <span>Relevance: {(source.relevance * 100).toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                  <p className="text-14 text-text-muted mt-4 line-clamp-3">
                    {source.snippet}
                  </p>
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="text-14 text-text-secondary">No sources cited for this article.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
