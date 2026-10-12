"use client";

import { useCallback, useEffect, useState } from "react";
import type { BattleMode } from "@/domain";
import { api, ApiError, setSessionToken } from "./api/client";
import type { BattleDTO, PlayerDTO, ReferenceDTO, SessionDTO, TodayDTO } from "./api/types";
import { AppContext } from "./AppContext";
import { Background } from "./components/Background";
import { getDiscordChannelId, isInsideDiscord, loginWithDiscord } from "./discord/discordAuth";
import { readJSON, writeJSON } from "./lib/storage";
import { BattleScreen } from "./screens/BattleScreen";
import { BootScreen } from "./screens/BootScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LeadScreen } from "./screens/LeadScreen";
import { LoginScreen } from "./screens/LoginScreen";

const SESSION_KEY = "dailyred.session";

type Screen =
  | { name: "boot"; status: string; error?: string }
  | { name: "login" }
  | { name: "home" }
  | { name: "lead"; mode: BattleMode; today: TodayDTO | null }
  | { name: "battle"; battle: BattleDTO };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "boot", status: "Subindo o Monte Prateado..." });
  const [player, setPlayer] = useState<PlayerDTO | null>(null);
  const [reference, setReference] = useState<ReferenceDTO | null>(null);
  const [insideDiscord] = useState(isInsideDiscord);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = useCallback(async (session: SessionDTO) => {
    setSessionToken(session.token);
    setPlayer(session.player);
    setReference(await api.reference());
    setScreen({ name: "home" });
  }, []);

  const boot = useCallback(async () => {
    setScreen({ name: "boot", status: insideDiscord ? "Conectando ao Discord..." : "Subindo o Monte Prateado..." });
    try {
      if (insideDiscord) {
        await enter(await loginWithDiscord());
        return;
      }
      // Local browser: reuse a saved test session if it is still valid.
      const saved = readJSON<SessionDTO>("session", SESSION_KEY);
      if (saved && saved.expiresAt > Date.now()) {
        setSessionToken(saved.token);
        try {
          const { player: me } = await api.me();
          await enter({ ...saved, player: me });
          return;
        } catch {
          setSessionToken(null);
          writeJSON("session", SESSION_KEY, null);
        }
      }
      const config = await api.authConfig();
      if (config.devLogin) setScreen({ name: "login" });
      else setScreen({ name: "boot", status: "", error: "Abra o Daily Battle pelo Discord para jogar." });
    } catch (e) {
      setScreen({ name: "boot", status: "", error: e instanceof Error ? e.message : "Não foi possível entrar." });
    }
  }, [enter, insideDiscord]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const devLogin = async (name: string) => {
    const session = await api.devLogin(name);
    writeJSON("session", SESSION_KEY, session);
    await enter(session);
  };

  const logout = () => {
    writeJSON("session", SESSION_KEY, null);
    setSessionToken(null);
    setPlayer(null);
    setScreen({ name: "login" });
  };

  /** Daily: resumes if already started. Starting asks the server, which also enforces one daily per day. */
  const startBattle = async (mode: BattleMode, leadIndex: number, championId: string | null) => {
    setBusy(true);
    setError(null);
    try {
      setScreen({ name: "battle", battle: await api.startBattle({ mode, leadIndex, championId, channelId: getDiscordChannelId() }) });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível começar a batalha");
    } finally {
      setBusy(false);
    }
  };

  const resumeDaily = async (battleId: string) => {
    setBusy(true);
    try {
      setScreen({ name: "battle", battle: await api.getBattle(battleId) });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível abrir a batalha");
    } finally {
      setBusy(false);
    }
  };

  let content: React.ReactNode;
  if (screen.name === "boot") content = <BootScreen status={screen.status} error={screen.error} onRetry={boot} />;
  else if (screen.name === "login") content = <LoginScreen onLogin={devLogin} />;
  else if (!player || !reference) content = <BootScreen status="Carregando..." />;
  else {
    content = (
      <AppContext.Provider value={{ player, reference, insideDiscord, logout: insideDiscord ? null : logout }}>
        {screen.name === "home" && (
          <HomeScreen
            busy={busy}
            error={error}
            onPlayDaily={(today) => setScreen({ name: "lead", mode: "daily", today })}
            onResumeDaily={resumeDaily}
            onPractice={(today) => setScreen({ name: "lead", mode: "practice", today })}
          />
        )}
        {screen.name === "lead" && (
          <LeadScreen
            mode={screen.mode}
            initialToday={screen.today}
            busy={busy}
            error={error}
            onBack={() => {
              setError(null);
              setScreen({ name: "home" });
            }}
            onConfirm={(leadIndex, championId) => startBattle(screen.mode, leadIndex, championId)}
          />
        )}
        {screen.name === "battle" && (
          <BattleScreen
            key={screen.battle.id}
            initial={screen.battle}
            onExit={() => setScreen({ name: "home" })}
            onPractice={() => setScreen({ name: "lead", mode: "practice", today: null })}
          />
        )}
      </AppContext.Provider>
    );
  }

  return (
    <>
      <Background snow={screen.name !== "battle"} />
      {content}
    </>
  );
}
