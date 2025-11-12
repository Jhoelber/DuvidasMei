import React from "react";

// Aceita http(s) + QUALQUER subdomínio dos domínios permitidos
// Ex.: www8.receita.fazenda.gov.br, www.youtube.com, gov.br etc.
const ALLOWED =
  /(https?:\/\/(?:[\w.-]+\.)?(?:gov\.br|sebrae\.com\.br|nfse\.gov\.br|receita\.fazenda\.gov\.br|youtube\.com|youtu\.be)\/[^\s]+)/gi;

export function linkifyAllowed(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = ALLOWED.exec(text)) !== null) {
    const url = match[0];
    const start = match.index;
    const end = start + url.length;

    if (start > lastIndex) nodes.push(text.slice(lastIndex, start));

    nodes.push(
      <a
        key={`${start}-${end}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600 dark:text-blue-400 hover:opacity-80"
      >
        {url}
      </a>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
