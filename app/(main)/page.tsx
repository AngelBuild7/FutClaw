import AppShell from "@/components/AppShell";
import { getScoutCount } from "@/lib/analytics";

// Dynamic so the live scout count is fresh per load (the stars fetch keeps its
// own 1h cache regardless).
export const dynamic = "force-dynamic";

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://futclaw.com/#website",
      url: "https://futclaw.com",
      name: "FutClaw",
      description: "Turn any GitHub profile into a player card rated out of 99.",
    },
    {
      "@type": "WebApplication",
      name: "FutClaw",
      url: "https://futclaw.com",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      description:
        "Turn any GitHub profile into a FIFA-Ultimate-Team-style player card rated out of 99, built from real GitHub stats.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default async function Home() {
  const scoutCount = await getScoutCount();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <AppShell scoutCount={scoutCount} />
    </div>
  );
}
