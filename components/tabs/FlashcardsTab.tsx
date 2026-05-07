"use client";

const FLASHCARD_URL = process.env.NEXT_PUBLIC_FLASHCARD_URL;

export default function FlashcardsTab() {
  if (!FLASHCARD_URL) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <p className="text-sm font-medium">No flashcard URL configured</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Set <code className="bg-muted px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_FLASHCARD_URL</code> in your environment to embed your flashcard app here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
      <iframe
        src={FLASHCARD_URL}
        title="Flashcards"
        className="w-full h-full"
        allow="fullscreen"
        loading="lazy"
      />
    </div>
  );
}
