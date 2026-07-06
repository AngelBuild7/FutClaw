import "server-only";
import { parseRepoInput } from "./repoInput";
import { pickToken } from "./tokens";

export type RepoErrorType = "invalid" | "notfound" | "ratelimit" | "network";

export interface RepoError {
  type: RepoErrorType;
  message: string;
}

export interface RepoContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  url: string;
}

export interface RepoSummary {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  contributors: RepoContributor[];
}

const TIMEOUT_MS = 8_000;
const BOT_LOGIN = /(?:^|[-_])bot(?:$|[-_])|github-actions|actions-user/i;

const fail = (type: RepoErrorType, message: string): never => {
  throw { type, message } satisfies RepoError;
};

async function githubRest<T>(path: string, shard: string): Promise<T> {
  const token = pickToken(shard);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token.token}` } : {}),
      },
      next: { revalidate: 1800 },
      signal: ctrl.signal,
    });

    if (res.status === 404) return fail("notfound", "That GitHub repo was not found.");
    if (res.status === 403 || res.status === 429) return fail("ratelimit", "GitHub rate limit hit. Try again shortly.");
    if (!res.ok) return fail("network", `GitHub returned an error (${res.status}).`);
    return (await res.json()) as T;
  } catch (e) {
    if ((e as Error).name === "AbortError") return fail("network", "GitHub took too long to respond.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

type RepoApi = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
};

type ContributorApi = {
  login?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
  type?: string;
};

export async function fetchRepoSummary(owner: string, repo: string, limit = 11): Promise<RepoSummary> {
  const parsed = parseRepoInput(`${owner}/${repo}`);
  if (!parsed) {
    return fail("invalid", "Use a public GitHub repo in owner/repo format.");
  }
  const fullName = `${parsed.owner}/${parsed.repo}`;
  const perPage = Math.min(Math.max(limit * 2, limit), 30);

  const [repoData, contributorsData] = await Promise.all([
    githubRest<RepoApi>(`/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`, fullName),
    githubRest<ContributorApi[]>(
      `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}/contributors?per_page=${perPage}`,
      fullName,
    ),
  ]);

  const contributors = contributorsData
    .filter((c) => c.type !== "Bot" && c.login && !BOT_LOGIN.test(c.login))
    .slice(0, limit)
    .map((c) => ({
      login: c.login!,
      avatarUrl: c.avatar_url ?? "",
      contributions: c.contributions ?? 0,
      url: c.html_url ?? `https://github.com/${c.login}`,
    }));

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    fullName: repoData.full_name,
    url: repoData.html_url,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language,
    contributors,
  };
}
