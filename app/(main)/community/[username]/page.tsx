import { notFound } from "next/navigation";
import CommunityCardDetail from "./CommunityCardDetail";
import { getCommunityCard, getCommunityRank } from "@/lib/community";

export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ platform?: string }>;
}) {
  const { username } = await params;
  const { platform } = await searchParams;
  const card = await getCommunityCard(username, platform === "youtube" ? "youtube" : "github");

  if (!card) {
    return {
      title: `@${username} | FutClaw Community`,
    };
  }

  return {
    title: `${card.name} | FutClaw Community`,
    description: `View ${card.name}'s FutClaw community card.`,
  };
}

export default async function CommunityCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ platform?: string }>;
}) {
  const { username } = await params;
  const { platform: platformParam } = await searchParams;
  const selectedPlatform = platformParam === "youtube" ? "youtube" : "github";
  const [card, communityRank] = await Promise.all([
    getCommunityCard(username, selectedPlatform),
    getCommunityRank(username),
  ]);

  if (!card) notFound();

  return <CommunityCardDetail card={card} communityRank={communityRank} />;
}
