export interface CategoryLogo {
  name: string;
  slug: string;
}

export const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  "1": { name: "Film & Animation", slug: "clapperboard" },
  "2": { name: "Autos & Vehicles", slug: "car" },
  "10": { name: "Music", slug: "music" },
  "15": { name: "Pets & Animals", slug: "dog" },
  "17": { name: "Sports", slug: "trophy" },
  "18": { name: "Short Movies", slug: "clapperboard" },
  "19": { name: "Travel & Events", slug: "compass" },
  "20": { name: "Gaming", slug: "gamepad" },
  "21": { name: "Videoblogging", slug: "video-camera" },
  "22": { name: "People & Blogs", slug: "conference-call" },
  "23": { name: "Comedy", slug: "happy" },
  "24": { name: "Entertainment", slug: "clapperboard" },
  "25": { name: "News & Politics", slug: "news" },
  "26": { name: "Howto & Style", slug: "palette" },
  "27": { name: "Education", slug: "open-book" },
  "28": { name: "Science & Technology", slug: "cpu" },
  "29": { name: "Nonprofits & Activism", slug: "heart" },
  "30": { name: "Movies", slug: "clapperboard" },
  "31": { name: "Anime/Animation", slug: "clapperboard" },
  "32": { name: "Action/Adventure", slug: "compass" },
  "33": { name: "Classics", slug: "clapperboard" },
  "34": { name: "Documentary", slug: "open-book" },
  "35": { name: "Drama", slug: "clapperboard" },
  "36": { name: "Family", slug: "conference-call" },
  "37": { name: "Foreign", slug: "globe" },
  "38": { name: "Horror", slug: "skull" },
  "39": { name: "Sci-Fi/Fantasy", slug: "sparkles" },
  "40": { name: "Thriller", slug: "skull" },
  "41": { name: "Shorts", slug: "lightning-bolt" },
  "42": { name: "Shows", slug: "tv" },
  "43": { name: "Soap Shows", slug: "tv" },
  "44": { name: "Drama", slug: "clapperboard" },
};

export function categoryLogoUrl(slug: string): string {
  return `https://img.icons8.com/ios-filled/100/ffffff/${slug}.png`;
}

export function rankCategories(categories: string[]): string[] {
  const counts = new Map<string, number>();
  for (const cat of categories) {
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

export function topCategoryLogo(rankedCategories: string[]): CategoryLogo | null {
  const top = rankedCategories[0];
  if (!top) return null;
  const matched = CATEGORY_MAP[top];
  if (matched) {
    return { name: matched.name, slug: matched.slug };
  }
  return { name: top, slug: "video-camera" };
}
