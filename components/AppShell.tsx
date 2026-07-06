"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FutClawHero from "@/components/FutClawHero";
import LoadingScreen from "@/components/LoadingScreen";
import { parseRepoInput } from "@/lib/github/repoInput";

interface Props {
  scoutCount: number | null;
}

type ScoutMode = "github" | "youtube" | "repo";

export default function AppShell({ scoutCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pending, setPending] = useState<{ name: string; platform: string } | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("futclaw:seen-home", "1");
    } catch {}
  }, []);

  const handleScout = (name: string, platform: ScoutMode) => {
    if (!name.trim()) return;
    const normalized = name.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/^@/, "");
    if (platform === "repo") {
      const parsed = parseRepoInput(name);
      if (!parsed) return;
      setPending({ name: `${parsed.owner}/${parsed.repo}`, platform });
      startTransition(() => {
        router.push(`/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`);
      });
      return;
    }
    setPending({ name: normalized, platform });
    startTransition(() => {
      if (platform === "youtube") {
        router.push(`/youtube/${encodeURIComponent(normalized)}`);
      } else {
        router.push(`/${encodeURIComponent(normalized)}`);
      }
    });
  };

  if (isPending && pending) return <LoadingScreen login={pending.name} />;

  return (
    <div id="top" className="overflow-x-hidden">
      <FutClawHero onScout={handleScout} scoutCount={scoutCount} />
    </div>
  );
}
