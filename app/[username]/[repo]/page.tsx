// Canonical repo route: futclaw.com/<owner>/<repo>, matching GitHub profile
// and repository paths so users can replace github.com with futclaw.com.
// /repo/<owner>/<repo> stays available for older shared links.
//
// The first dynamic segment must use the same param name as app/[username].
// Next treats sibling dynamic segments at the same level as one route shape.
import RepoClubPage, { generateMetadata as generateRepoClubMetadata } from "../../repo/[owner]/[repo]/page";

export const dynamic = "force-dynamic";

type PageParams = {
  username: string;
  repo: string;
};

function toRepoParams(params: Promise<PageParams>) {
  return params.then(({ username, repo }) => ({ owner: username, repo }));
}

export function generateMetadata({ params }: { params: Promise<PageParams> }) {
  return generateRepoClubMetadata({ params: toRepoParams(params) });
}

export default function CanonicalRepoClubPage({ params }: { params: Promise<PageParams> }) {
  return <RepoClubPage params={toRepoParams(params)} />;
}
