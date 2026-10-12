"use client";

import { useState, type ReactNode } from "react";
import { useApp } from "../AppContext";
import { GearIcon, LogoutIcon } from "./icons";
import { SettingsModal } from "./SettingsModal";
import styles from "./TopBar.module.css";
import { Avatar, Button, Logo } from "./ui";

export function TopBar({ left }: { left?: ReactNode }) {
  const { player, logout } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.left}>{left ?? <Logo size="sm" />}</div>
      <div className={styles.right}>
        <div className={styles.player}>
          <Avatar id={player.id} name={player.displayName} avatar={player.avatar} size={30} />
          <span className={styles.playerName}>{player.displayName}</span>
        </div>
        <Button variant="ghost" size="sm" aria-label="Configurações" onClick={() => setSettingsOpen(true)} icon={<GearIcon />}>
          <span className={styles.hideNarrow}>Ajustes</span>
        </Button>
        {logout && (
          <Button variant="ghost" size="sm" aria-label="Sair" onClick={logout} icon={<LogoutIcon />}>
            <span className={styles.hideNarrow}>Sair</span>
          </Button>
        )}
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
