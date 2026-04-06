import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ErrorScreenProps {
  headline: string;
  explanationPrimary: string;
  explanationSecondary?: string;
  explanationTertiary?: string;
}

export function ErrorScreen({
  headline,
  explanationPrimary,
  explanationSecondary = "This usually happens when API limits are reached or a service goes offline.",
  explanationTertiary = "You can try running the investigation again.",
}: ErrorScreenProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen px-24 py-32 flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
      <div className="w-[48px] h-[48px] border-2 border-accent rounded-full flex items-center justify-center mb-32">
        <span className="text-accent text-20 font-600">!</span>
      </div>
      
      <h1 className="font-600 text-28 text-text-primary mb-24">
        {headline}
      </h1>
      
      <div className="flex flex-col gap-16 mb-48 text-16 text-text-secondary font-400">
        <p>{explanationPrimary}</p>
        <p>{explanationSecondary}</p>
        <p>{explanationTertiary}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-24 items-center justify-center w-full">
        {/* Try Again returns to Entry with inputs preserved via router back or simply keeping state. Actually pushing back to / might reset states unless handled. We'll use router.back() as a proxy, or just link to home. */}
        <button 
          onClick={() => router.back()}
          className="bg-accent text-[#000000] font-500 text-16 px-32 py-16 w-full sm:w-auto hover:opacity-90"
        >
          Try Again
        </button>

        <Link 
          href="/"
          className="font-500 text-16 text-text-secondary hover:text-text-primary"
        >
          Go Back
        </Link>
      </div>
    </main>
  );
}
