import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/layout/full-width-divider";
import { CommunityThemeToggle } from "@/components/layout/community-theme-toggle";

export function Footer() {
  return (
    <footer className="relative bg-bg">
      <FullWidthDivider position="top" />
      <div className="mx-auto flex max-w-5xl flex-col gap-8 p-4 pt-5 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-sm flex-col gap-4">
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            FutClaw
          </span>
          <p className="max-w-sm text-balance text-sm text-ink-dim">
            Your GitHub, rated out of 99. Turn any profile into a FIFA-style player card.
          </p>
          <div className="flex gap-2">
            {socialLinks.map((item, index) => (
              <Button
                key={`social-${item.link}-${index}`}
                aria-label={item.label}
                size="icon"
                variant="outline"
                render={<a href={item.link} target="_blank" rel="noopener noreferrer" />}
                nativeButton={false}
              >
                {item.icon}
              </Button>
            ))}
          </div>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-col items-start gap-3 text-sm md:items-end"
        >
          {resources.map(({ href, title }) => (
            <a
              className="text-ink-dim transition hover:text-ink"
              href={href}
              key={title}
            >
              {title}
            </a>
          ))}
        </nav>
      </div>
      <FullWidthDivider />
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 py-4">
        <CommunityThemeToggle />
        <p className="text-center text-sm font-light text-ink-soft">
          &copy; {new Date().getFullYear()} FutClaw. Open source under the MIT License.
        </p>
        <p className="text-center text-xs text-ink-faint">
          Inspired by{" "}
          <a
            href="https://github.com/Younesfdj/gitfut"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-dim transition hover:text-ink"
          >
            GitFut
          </a>
          , originally by{" "}
          <a
            href="https://github.com/Younesfdj"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-dim transition hover:text-ink"
          >
            @Younesfdj
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

const resources = [
  { title: "Scout", href: "/" },
  { title: "Community", href: "/community" },
  { title: "GitHub", href: "https://github.com/AngelBuild7/FutClaw2" },
];

const socialLinks = [
  { label: "Open FutClaw on GitHub", icon: <GithubIcon />, link: "https://github.com/AngelBuild7/FutClaw2" },
];
