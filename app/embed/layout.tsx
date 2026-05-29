"use client";

import { useEffect } from "react";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add embed class to html and body for full height + overflow control
    document.documentElement.classList.add("embed-mode");
    document.body.classList.add("embed-mode");

    // Load Outfit font by default for warm beige/modern embeds
    const existingLink = document.querySelector('link[data-font="outfit"]');
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap";
      link.setAttribute("data-font", "outfit");
      document.head.appendChild(link);
    }

    return () => {
      document.documentElement.classList.remove("embed-mode");
      document.body.classList.remove("embed-mode");
    };
  }, []);

  return (
    <div
      className="embed-wrapper"
      style={{
        margin: 0,
        padding: 0,
        background: "var(--bg-primary)",
        width: "100%",
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

