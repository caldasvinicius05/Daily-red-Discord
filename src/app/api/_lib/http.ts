import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AppError, UnauthorizedError } from "@/application/errors";
import type { UseCases } from "@/application/useCases";
import { verifySessionToken, type Session } from "@/infrastructure/auth/sessionTokens";
import { config } from "@/infrastructure/config";
import { getUseCases } from "@/infrastructure/container";

const STATUS_BY_CODE: Record<string, number> = {
  bad_request: 400,
  invalid_action: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  already_played: 409,
  battle_ended: 409,
  conflict: 409,
};

export interface ApiErrorBody {
  error: { code: string; message: string };
}

function errorResponse(code: string, message: string): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status: STATUS_BY_CODE[code] ?? 500 });
}

interface HandlerContext {
  app: UseCases;
  request: NextRequest;
}

/** Wraps a route: injects the use cases, serialises the result, maps errors to HTTP. */
export function handle<C>(fn: (ctx: HandlerContext, routeCtx: C) => Promise<unknown>) {
  return async (request: NextRequest, routeCtx: C): Promise<NextResponse> => {
    try {
      const app = await getUseCases();
      return NextResponse.json(await fn({ app, request }, routeCtx));
    } catch (error) {
      if (error instanceof AppError) return errorResponse(error.code, error.message);
      if (error instanceof z.ZodError) {
        return errorResponse("bad_request", error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "));
      }
      if (error instanceof SyntaxError) return errorResponse("bad_request", "JSON inválido");
      console.error(error);
      return errorResponse("internal", "Erro inesperado no servidor");
    }
  };
}

/** Reads `Authorization: Bearer <token>`. */
export function requireSession(request: NextRequest): Session {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = token ? verifySessionToken(token, config.sessionSecret) : null;
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function parseBody<T>(request: NextRequest, schema: z.ZodType<T>): Promise<T> {
  return schema.parse(await request.json());
}

// ---------- Request schemas ----------

export const playerActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("move"), move: z.number().int().min(0).max(3) }),
  z.object({ type: z.literal("switch"), teamIndex: z.number().int().min(0).max(5) }),
]);

export const startBattleSchema = z.object({
  mode: z.enum(["daily", "practice"]),
  leadIndex: z.number().int().min(0).max(5),
  /** Practice only; omitted or null → a random champion. */
  championId: z.string().min(1).max(40).nullish(),
  /** Discord channel the Activity runs in, where the day's results get posted. */
  channelId: z
    .string()
    .regex(/^\d{5,25}$/)
    .nullish(),
});

export const discordLoginSchema = z.object({
  code: z.string().min(1).max(512),
  guildId: z.string().regex(/^\d{5,25}$/).nullable(),
});

export const devLoginSchema = z.object({
  name: z.string().trim().min(1).max(32),
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
