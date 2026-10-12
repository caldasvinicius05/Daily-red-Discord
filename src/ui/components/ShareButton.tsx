"use client";

import { useState } from "react";
import { useApp } from "../AppContext";
import { shareToDiscord } from "../discord/discordAuth";
import { copyText } from "../lib/clipboard";
import { CheckIcon, CopyIcon, ShareIcon } from "./icons";
import { Button } from "./ui";

type State = "idle" | "busy" | "sent" | "copied" | "failed";

const LABELS: Record<State, { discord: string; browser: string }> = {
  idle: { discord: "Postar no Discord", browser: "Copiar resultado" },
  busy: { discord: "Abrindo...", browser: "Copiando..." },
  sent: { discord: "Postado!", browser: "Copiado!" },
  copied: { discord: "Link copiado", browser: "Copiado!" },
  failed: { discord: "Não deu para postar", browser: "Selecione e copie" },
};

/**
 * Inside Discord: opens Discord's share dialog so the player picks the channel.
 * In a normal browser: copies the text to the clipboard.
 */
export function ShareButton({ text, size = "md" }: { text: string; size?: "md" | "lg" }) {
  const { insideDiscord } = useApp();
  const [state, setState] = useState<State>("idle");

  const share = async () => {
    setState("busy");
    try {
      if (insideDiscord) {
        const outcome = await shareToDiscord(text);
        setState(outcome === "cancelled" ? "idle" : outcome);
      } else {
        setState((await copyText(text)) ? "sent" : "failed");
      }
    } catch {
      setState("failed");
    }
  };

  const done = state === "sent" || state === "copied";
  return (
    <Button
      variant="secondary"
      size={size}
      icon={done ? <CheckIcon /> : insideDiscord ? <ShareIcon /> : <CopyIcon />}
      onClick={share}
      disabled={state === "busy"}
    >
      {LABELS[state][insideDiscord ? "discord" : "browser"]}
    </Button>
  );
}
