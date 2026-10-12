/** Base class so the HTTP layer can map application errors to status codes in one place. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super("not_found", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Essa batalha pertence a outro jogador") {
    super("forbidden", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sessão inválida ou expirada") {
    super("unauthorized", message);
  }
}

export class AlreadyPlayedError extends AppError {
  constructor() {
    super("already_played", "Você já jogou a batalha de hoje");
  }
}

export class BattleEndedError extends AppError {
  constructor() {
    super("battle_ended", "Essa batalha já terminou");
  }
}

export class InvalidActionError extends AppError {
  constructor(reason: string) {
    super("invalid_action", reason);
  }
}

/** Two requests tried to advance the same battle at once; the client should reload it. */
export class ConflictError extends AppError {
  constructor() {
    super("conflict", "A batalha foi atualizada em outra requisição");
  }
}
