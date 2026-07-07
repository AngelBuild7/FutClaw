// Canonical repo route: futclaw.com/<owner>/<repo>, matching GitHub profile
// and repository paths so users can replace github.com with futclaw.com.
// /repo/<owner>/<repo> stays available for older shared links.
//
// The first dynamic segment must use the same param name as app/[username].
// Next treats sibling dynamic segments at the same level as one route shape.
export const dynamic = "force-dynamic";
export { default, generateMetadata } from "../../repo/[owner]/[repo]/page";
