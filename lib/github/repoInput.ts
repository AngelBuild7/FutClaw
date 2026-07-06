export interface ParsedRepoInput {
  owner: string;
  repo: string;
}

const OWNER_REPO = /^([a-z\d](?:[a-z\d-]{0,38}))\/([A-Za-z0-9_.-]{1,100})$/i;

function trimRepoSuffix(repo: string) {
  return repo.replace(/\.git$/i, "");
}

function parseOwnerRepo(value: string): ParsedRepoInput | null {
  const match = value.match(OWNER_REPO);
  if (!match) return null;
  return { owner: match[1], repo: trimRepoSuffix(match[2]) };
}

export function parseRepoInput(input: string): ParsedRepoInput | null {
  const raw = input.trim().replace(/^@/, "");
  if (!raw) return null;

  const sshMatch = raw.match(/^git@github\.com:([^/\s]+)\/([^\s/]+?)(?:\.git)?$/i);
  if (sshMatch) return parseOwnerRepo(`${sshMatch[1]}/${trimRepoSuffix(sshMatch[2])}`);

  const maybeUrl = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(maybeUrl);
    if (url.hostname.toLowerCase().replace(/^www\./, "") === "github.com") {
      const [owner, repo] = url.pathname.split("/").filter(Boolean);
      if (owner && repo) return parseOwnerRepo(`${owner}/${trimRepoSuffix(repo)}`);
      return null;
    }
  } catch {
    // Fall through to owner/repo parsing.
  }

  return parseOwnerRepo(raw);
}
