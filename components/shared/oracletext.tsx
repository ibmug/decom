
"use client";

import React from "react";

interface OracleTextProps {
  text: string;
  iconSize?: number;  // in px
}

export default function OracleText({ text, iconSize = 16 }: OracleTextProps) {
  // 1) Escape HTML for safety
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;");

  // 2) Build HTML: newline→<br>, tokens→<img>
  const html = escape(text)
    .replace(/\n/g, "<br/>")
    .replace(/\{([^}]+)\}/g, (_, sym) => {
      const code = sym.toLowerCase().replace(/\//g, "");
      return `<img 
                src="/symbols/${code}.svg" 
                alt="${sym}" 
                style="display:inline-block;width:${iconSize}px;height:${iconSize}px;vertical-align:text-bottom;"
              />`;
    });

  // 3) Render as HTML
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
