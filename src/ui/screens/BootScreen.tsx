"use client";

import { Button, Logo, Spinner } from "../components/ui";
import styles from "./entry.module.css";

export function BootScreen({ status, error, onRetry }: { status: string; error?: string | undefined; onRetry?: () => void }) {
  return (
    <main className={styles.center}>
      <div className={styles.bootCard}>
        <Logo size="lg" />
        {error ? (
          <>
            <p className={styles.error}>{error}</p>
            {onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                Tentar de novo
              </Button>
            )}
          </>
        ) : (
          <Spinner label={status} />
        )}
      </div>
    </main>
  );
}
