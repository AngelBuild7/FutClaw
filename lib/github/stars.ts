import "server-only";

// The project's own GitHub repo — its star count powers the "Support the
// project" link in the home footer.
const REPO = "younesfdj/futclaw";

// Best-effort star count, cached for an hour (revalidate) so it's fast and never
// rate-limited — one cached call covers all visitors instead of each browser
// hitting GitHub. Returns null on any failure; the UI degrades to a plain link.
export async function getRepoStars(): Promise<number | null> {
  try {
    const token = process.env.GITHUB_TOKEN;
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
