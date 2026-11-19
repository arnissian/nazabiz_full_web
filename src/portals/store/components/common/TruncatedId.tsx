import { useState } from "react";

// Affiche les références du magasin avec possibilité de les développer.
export function TruncatedId({ id, startChars = 1, endChars = 4 }: { id: string; startChars?: number; endChars?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si la référence est plus courte que le seuil, on l'affiche directement
  if (!id || id.length <= startChars + endChars + 3) {
    return <span className="fw-mono text-dark">{id}</span>;
  }

  const start = id.slice(0, startChars);
  const end = id.slice(-endChars);
  const truncated = `${start}...${end}`;

  return (
    <span
      onClick={() => setIsExpanded(!isExpanded)}
      className="cursor-pointer  user-select-none text-decoration-underline-hover"
      style={{ cursor: "pointer", fontFamily: "monospace" }}
      title={isExpanded ? "Cliquer pour réduire" : "Cliquer pour tout afficher"}
    >
      {isExpanded ? id : truncated}
    </span>
  );
}