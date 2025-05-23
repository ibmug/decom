"use client";

import React from 'react';
import Image from 'next/image';

interface ManaCostProps {
  cost: string;    // e.g. "{2}{G}{U}"
  size?: number;   // icon width/height in px (default: 20)
}

export default function ManaCost({ cost, size = 20 }: ManaCostProps) {
  const parts: (string | { sym: string })[] = [];
  const re = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(cost))) {
    // push any text before this symbol
    if (match.index > lastIndex) {
      parts.push(cost.slice(lastIndex, match.index));
    }
    // normalize the symbol code for filename
    const code = match[1]
      .toLowerCase()
      .replace(/[{}]/g, '')
      .replace(/\//g, '');
    parts.push({ sym: code });
    lastIndex = match.index + match[0].length;
  }

  // push any remaining text
  if (lastIndex < cost.length) {
    parts.push(cost.slice(lastIndex));
  }

  return (
    <span className="inline-flex items-center space-x-0.5">
      {parts.map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <Image
            key={i}
            src={`/symbols/${part.sym}.svg`}
            alt={part.sym}
            width={size}
            height={size}
          />
        )
      )}
    </span>
  );
}
