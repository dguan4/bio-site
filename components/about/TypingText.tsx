"use client";

import { useEffect, useState } from "react";

interface Props {
  phrases: string[];
  className?: string;
}

export default function TypingText({ phrases, className }: Props) {
  const [idx, setIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;
    const target = phrases[idx];

    if (!deleting) {
      if (displayed.length < target.length) {
        const t = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          80,
        );
        return () => clearTimeout(t);
      }
      // fully typed — pause then start deleting
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }

    if (displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
      return () => clearTimeout(t);
    }
    // fully deleted — gap then move to next phrase
    const t = setTimeout(() => {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    }, 300);
    return () => clearTimeout(t);
  }, [displayed, deleting, idx, phrases]);

  if (!phrases.length) return null;

  return (
    <span className={className}>
      {displayed}
      <span style={{ animation: "cursor-blink 1s step-end infinite" }}>|</span>
    </span>
  );
}
