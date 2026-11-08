"use client";

import { useState, useCallback } from "react";

export function useActionStatus() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const runAction = useCallback(
    async <T extends { error?: string; success?: boolean }>(
      fn: () => Promise<T>,
      onSuccess?: () => void
    ) => {
      setError(null);
      setIsPending(true);
      try {
        const res = await fn();
        if (res?.error) {
          setError(res.error);
        } else {
          onSuccess?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error occurred");
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { error, setError, isPending, runAction };
}