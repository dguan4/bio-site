"use client";

import { useEffect, useState } from "react";
import type { GitHubData } from "@/lib/types";

// Module-level cache so switching tabs never re-fetches within a session.
let _cache: GitHubData | null = null;
let _promise: Promise<GitHubData> | null = null;

export function useGitHubData() {
  const [data, setData] = useState<GitHubData | null>(_cache);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_cache) {
      setData(_cache);
      setLoading(false);
      return;
    }

    if (!_promise) {
      _promise = fetch("/api/github").then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json() as Promise<GitHubData>;
      });
    }

    _promise
      .then((d) => {
        _cache = d;
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load GitHub data");
        setLoading(false);
        _promise = null; // allow retry on next mount
      });
  }, []);

  return { data, loading, error };
}
