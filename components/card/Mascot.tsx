"use client";

import { memo } from "react";

// FutClaw mascot — Angel's lobster with a shirt and two footballs.
// SVG scales perfectly at any size.
interface MascotProps {
  size?: number;
  className?: string;
  animate?: boolean;
  /** @deprecated ball is baked into the asset; kept for call-site compatibility */
  kick?: boolean;
  /** @deprecated ball is baked into the asset; kept for call-site compatibility */
  ball?: boolean;
}

function Mascot({ size = 220, className, animate = true }: MascotProps) {
  return (
    <img
      src="/mascot.svg"
      alt="FutClaw mascot — a lobster with a shirt and two footballs"
      width={size}
      height={size}
      className={`${animate ? "animate-float" : ""} ${className ?? ""}`}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

export default memo(Mascot);
