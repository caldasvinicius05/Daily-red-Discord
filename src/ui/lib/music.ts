/**
 * Battle themes, served from `public/ost/`. Champions from the same games share a track.
 * A champion without an entry (or a missing file) just battles in silence.
 */
const THEMES: Record<string, string> = {
  blue: "blue",
  red: "red-lance",
  lance: "red-lance",
  steven: "steven-wallace",
  wallace: "steven-wallace",
  cynthia: "cynthia",
};

export function championTheme(championId: string): string | null {
  const file = THEMES[championId];
  return file ? `/ost/${file}.mp3` : null;
}
