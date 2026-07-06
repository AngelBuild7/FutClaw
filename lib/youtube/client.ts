import "server-only";

export type YoutubeErrorType = "invalid" | "notfound" | "ratelimit" | "network" | "config";

export interface YoutubeError {
  type: YoutubeErrorType;
  message: string;
}

export interface RawVideo {
  id: string;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  categoryId: string;
  publishedAt: string;
}

export interface RawPayload {
  channelId: string;
  login: string;
  name: string;
  avatarUrl: string;
  location: string | null;
  createdAt: string;
  subscribers: number;
  videoCount: number;
  viewCount: number;
  recentVideos: RawVideo[];
}

const REQUEST_TIMEOUT_MS = 8_000;

type PlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
};

const fail = (type: YoutubeErrorType, message: string): never => {
  throw { type, message } satisfies YoutubeError;
};

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchWithTimeout(url: string, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 403 || res.status === 429) {
        return fail("ratelimit", "YouTube rate limit or quota exceeded. Try again later.");
      }
      if (res.status === 400) {
        return fail("invalid", "Invalid request to YouTube API.");
      }
      if (res.status >= 500) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        return fail("network", `YouTube service is currently unavailable (${res.status}).`);
      }
      return res;
    } catch {
      clearTimeout(timer);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      return fail("network", "Couldn't reach YouTube — check your connection.");
    }
  }
  return fail("network", "YouTube request failed.");
}

export async function fetchProfile(username: string): Promise<RawPayload> {
  const handleInput = username.trim();
  if (!handleInput) return fail("invalid", "Please provide a YouTube handle.");

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return fail("config", "Server is missing a YouTube API key.");

  let queryParam = "";
  if (handleInput.startsWith("UC") && handleInput.length === 24) {
    queryParam = `id=${encodeURIComponent(handleInput)}`;
  } else {
    const handle = handleInput.startsWith("@") ? handleInput : `@${handleInput}`;
    queryParam = `forHandle=${encodeURIComponent(handle)}`;
  }

  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&${queryParam}&key=${apiKey}`;
  const channelRes = await fetchWithTimeout(channelUrl);
  if (!channelRes.ok) return fail("network", "Error fetching channel from YouTube.");

  const channelData = await channelRes.json();
  let channel = channelData.items?.[0];

  if (!channel && !handleInput.startsWith("UC")) {
    const fallbackUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forUsername=${encodeURIComponent(handleInput)}&key=${apiKey}`;
    const fallbackRes = await fetchWithTimeout(fallbackUrl);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      channel = fallbackData.items?.[0];
    }
  }

  if (!channel) return fail("notfound", "No YouTube channel by that name or handle.");

  const snippet = channel.snippet;
  const stats = channel.statistics;
  const contentDetails = channel.contentDetails;

  const login = (snippet.customUrl || handleInput).replace(/^@/, "");
  const name = snippet.title;
  const avatarUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || "";
  const location = snippet.country || null;
  const createdAt = snippet.publishedAt;
  const subscribers = parseInt(stats.subscriberCount || "0", 10);
  const videoCount = parseInt(stats.videoCount || "0", 10);
  const viewCount = parseInt(stats.viewCount || "0", 10);
  const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;

  const recentVideos: RawVideo[] = [];

  if (uploadsPlaylistId && videoCount > 0) {
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    const playlistRes = await fetchWithTimeout(playlistUrl);
    if (playlistRes.ok) {
      const playlistData = await playlistRes.json();
      const videoIds: string[] = ((playlistData.items || []) as PlaylistItem[])
        .map((item) => item.contentDetails?.videoId)
        .filter((id): id is string => Boolean(id));

      if (videoIds.length > 0) {
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds.join(",")}&key=${apiKey}`;
        const videosRes = await fetchWithTimeout(videosUrl);
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          for (const item of videosData.items || []) {
            const vStats = item.statistics || {};
            const vDetails = item.contentDetails || {};
            const vSnippet = item.snippet || {};

            recentVideos.push({
              id: item.id,
              views: parseInt(vStats.viewCount || "0", 10),
              likes: parseInt(vStats.likeCount || "0", 10),
              comments: parseInt(vStats.commentCount || "0", 10),
              durationSeconds: parseDuration(vDetails.duration || ""),
              categoryId: vSnippet.categoryId || "22",
              publishedAt: vSnippet.publishedAt,
            });
          }
        }
      }
    }
  }

  return {
    channelId: channel.id,
    login,
    name,
    avatarUrl,
    location,
    createdAt,
    subscribers,
    videoCount,
    viewCount,
    recentVideos,
  };
}
