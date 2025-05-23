"use client";
import React from 'react';
import Image from 'next/image';

/**
 * Render a mana cost string (e.g. "{2}{G}{U}") as inline mana symbols.
 */
export function renderManaCost(
  manaCost: string,
  size: number = 20
): JSX.Element {
  return (
    <span className="inline-flex items-center space-x-0.5">
      {parseManaTokens(manaCost, size)}
    </span>
  );
}

function parseManaTokens(text: string, size: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    // push raw text chunk
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // symbol code, normalized
    const code = match[1].toLowerCase().replace(/\//g, "");
    parts.push(
      <Image
        key={`${code}-${match.index}`}
        src={`/symbols/${code}.svg`}
        alt={match[1]}
        width={size}
        height={size}
        style={{ display: "inline-block", verticalAlign: "text-bottom" }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // trailing text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function renderOracleText(oracleText: string, size = 18) {
  const lines = oracleText.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => (
        <p key={idx} className="text-base leading-relaxed">
          {parseManaTokens(line, size)}
        </p>
      ))}
    </div>
  );
}