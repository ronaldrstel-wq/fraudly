"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import type { ScamVerdict } from "@/types/scam";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { WatchlistItemTypeSlug } from "@/lib/watchlist/types";

export type UseWatchlistItemParams = {
  itemType: WatchlistItemTypeSlug;
  rawKey: string;
  title: string;
  detailPath: string;
  trustScore: number | null;
  verdict: ScamVerdict;
};

export function useWatchlistItem({
  itemType,
  rawKey,
  title,
  detailPath,
  trustScore,
  verdict
}: UseWatchlistItemParams) {
  const { isSignedIn, isLoaded } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [watched, setWatched] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    if (!isSignedIn || !rawKey.trim()) {
      setChecking(false);
      setWatched(false);
      setItemId(null);
      return;
    }

    let cancelled = false;
    setChecking(true);
    setError(null);

    const q = new URLSearchParams({
      itemType,
      externalKey: rawKey.trim()
    });

    fetch(`/api/watchlist/check?${q.toString()}`)
      .then(async (r) => {
        const data = (await r.json()) as { watched?: boolean; id?: string | null };
        if (!cancelled) {
          setWatched(Boolean(data.watched));
          setItemId(typeof data.id === "string" ? data.id : null);
        }
      })
      .catch(() => {
        if (!cancelled) setError(EN_MESSAGES.watchlist.loadError);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, itemType, rawKey, hydrated]);

  const toggleWatched = useCallback(async () => {
    if (!isSignedIn || busy) return;

    if (watched) {
      if (!itemId) {
        setError(EN_MESSAGES.watchlist.removeError);
        return;
      }
      setBusy(true);
      setError(null);
      setWatched(false);
      const prevId = itemId;
      setItemId(null);
      try {
        const res = await fetch(`/api/watchlist?id=${encodeURIComponent(prevId)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("remove_failed");
      } catch {
        setWatched(true);
        setItemId(prevId);
        setError(EN_MESSAGES.watchlist.removeError);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    setError(null);
    setWatched(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          rawKey: rawKey.trim(),
          title: title.trim().slice(0, 512),
          detailPath,
          trustScore,
          verdict
        })
      });
      const payload = (await res.json().catch(() => null)) as { item?: { id: string } | null } | null;
      if (!res.ok) throw new Error("save_failed");
      const newId = payload?.item?.id;
      if (typeof newId === "string") setItemId(newId);
    } catch {
      setWatched(false);
      setItemId(null);
      setError(EN_MESSAGES.watchlist.saveError);
    } finally {
      setBusy(false);
    }
  }, [busy, detailPath, isSignedIn, itemType, rawKey, title, trustScore, verdict, watched, itemId]);

  return {
    hydrated,
    isLoaded,
    isSignedIn,
    checking,
    watched,
    busy,
    error,
    setError,
    toggleWatched,
    ariaBusy: checking || busy
  };
}
