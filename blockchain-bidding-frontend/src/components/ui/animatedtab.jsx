"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { TabsContent } from "@/components/ui/tabs";

export function AnimatedTabContent({ value, children }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // animate whenever the tab becomes visible
    if (el.closest("[data-state='active']")) {
      gsap.fromTo(
        el.querySelectorAll("form > *"),
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, [value]);

  return (
    <TabsContent value={value}>
      <div ref={ref} className="overflow-hidden">
        {children}
      </div>
    </TabsContent>
  );
}