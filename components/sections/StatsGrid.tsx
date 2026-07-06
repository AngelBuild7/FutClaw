"use client";

import { motion, useInView } from "framer-motion";
import { Ghost, Users, Gauge, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

type Stat = {
  icon: typeof Ghost;
  value: number;
  suffix?: string;
  label: string;
};

const STATS: Stat[] = [
  { icon: Ghost, value: 287_000, suffix: "+", label: "Cards generated" },
  { icon: Users, value: 12_400, suffix: "+", label: "Devs rated" },
  { icon: Gauge, value: 47, label: "Avg rating / 99" },
  { icon: Globe, value: 89, suffix: "+", label: "Countries" },
];

function formatNumber(n: number) {
  if (n >= 1000) return Math.round(n / 1000).toLocaleString() + "K";
  return n.toLocaleString();
}

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-8 border-t border-line py-16 lg:grid-cols-4">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: easeOut }}
            className="flex flex-col gap-2"
          >
            <Icon className="size-5 text-ink-soft" />
            <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-ink lg:text-3xl">
              <Counter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="text-xs text-ink-soft">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
