import type { ReactElement, SVGProps } from "react";

/** Original, minimal glyphs for each type (24×24 grid). */
const GLYPHS: Record<string, ReactElement> = {
  Normal: (
    <>
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  Fire: <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.8-5.2 3-7 .2 2 1.2 3.2 2.4 3.4C11 7.6 11.2 4.6 12 2z" />,
  Water: <path d="M12 2.5c3.6 5 6.5 8.4 6.5 12a6.5 6.5 0 0 1-13 0c0-3.6 2.9-7 6.5-12z" />,
  Electric: <path d="M13.5 2 4.5 13.5h6.2L9.5 22l9-12h-6.2l1.2-8z" />,
  Grass: <path d="M20 3.5C11 3.5 5 8.5 5 15.5c0 1.7.4 3.1 1 4.3 1.6-5.4 5.4-9.4 10.6-11.6-4.3 3-7.3 6.6-9 12 9.2 1.2 12.4-6.4 12.4-16.7z" />,
  Ice: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6" />
      <path d="M9.5 4 12 6.3 14.5 4M9.5 20 12 17.7 14.5 20" />
    </g>
  ),
  Fighting: <path d="m12 2 2.4 5.6 6-1.4-3.6 5 3.6 5-6-1.4L12 22l-2.4-6.2-6 1.4 3.6-5-3.6-5 6 1.4z" />,
  Poison: (
    <>
      <circle cx="9.5" cy="14" r="6" />
      <circle cx="16.5" cy="8" r="4" />
      <circle cx="18" cy="16.5" r="2.2" />
    </>
  ),
  Ground: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M3 9.5h18M5.5 14.5h13M8.5 19.5h7" />
    </g>
  ),
  Flying: <path d="M3 13c4-1 6.5-4 9-8 .6 3.5-.6 6-2.2 7.6C13.5 11 17 9 21 9c-1.3 4.6-5.4 8-10.5 8-2.6 0-5-1.4-7.5-4z" />,
  Psychic: (
    <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1-6 6" />
    </g>
  ),
  Bug: (
    <>
      <ellipse cx="12" cy="14" rx="6" ry="7.5" />
      <path d="M12 6.5v15" stroke="rgba(0,0,0,.35)" strokeWidth="1.6" />
      <path d="M9 6 6.5 2.5M15 6l2.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  Rock: <path d="m7 4 8.5-1.5L21 9l-1.5 9L12 21.5 4 18 2.8 10z" />,
  Ghost: <path d="M12 2.5a7.5 7.5 0 0 0-7.5 7.5v11l2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2V10A7.5 7.5 0 0 0 12 2.5zM9 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fillRule="evenodd" />,
  Dragon: <path d="M12 1.5 18 9l-2.5 2.2L19 22l-7-5.5L5 22l3.5-10.8L6 9z" />,
  Dark: <path d="M15.5 3a9 9 0 1 0 5.5 14.8A7.5 7.5 0 0 1 15.5 3z" />,
  Steel: (
    <path
      d="M12 2.2 20.5 7v10L12 21.8 3.5 17V7zm0 6.3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"
      fillRule="evenodd"
    />
  ),
};

export function TypeIcon({ type, ...props }: { type: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {GLYPHS[type] ?? GLYPHS.Normal}
    </svg>
  );
}

/** Physical: impact burst. Special: concentric waves. Status: half-filled ring. */
export function CategoryIcon({ category, ...props }: { category: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {category === "Physical" && (
        <path fill="currentColor" d="m12 3 2 5 5-2-2 5 4 2-5 1.5 1.5 5.5-5.5-3-3 4.5-1-5.5L2.5 16l3-4.5L2 8.5l5.5-.5L8 3l3 3.5z" />
      )}
      {category === "Special" && (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="9.5" opacity=".6" />
        </g>
      )}
      {category === "Status" && (
        <g>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}
