// Validación + parsing de los settings configurables de un grupo. Se usa
// tanto en POST /api/groups (creación) como en PATCH /api/groups/[slug]
// (edición). Si algo no se valida, devuelve { error: string }.

export type GroupSettingsInput = {
  description?: unknown;
  predictionLockMode?: unknown;
  lockMinutesBefore?: unknown;
  joinPolicy?: unknown;
  joinDeadline?: unknown;
  allowLateJoin?: unknown;
  predictionsVisibility?: unknown;
};

export type GroupSettings = {
  description: string | null;
  predictionLockMode: "per-match" | "tournament-start";
  lockMinutesBefore: number;
  joinPolicy: "open" | "approval" | "closed";
  joinDeadline: Date | null;
  allowLateJoin: boolean;
  predictionsVisibility: "hidden-until-lock" | "open";
};

const DEFAULTS: GroupSettings = {
  description: null,
  predictionLockMode: "per-match",
  lockMinutesBefore: 0,
  joinPolicy: "open",
  joinDeadline: null,
  allowLateJoin: false,
  predictionsVisibility: "hidden-until-lock",
};

export function defaultSettings(): GroupSettings {
  return { ...DEFAULTS };
}

const LOCK_MODES = ["per-match", "tournament-start"] as const;
const JOIN_POLICIES = ["open", "approval", "closed"] as const;
const VISIBILITIES = ["hidden-until-lock", "open"] as const;

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * Parsea + valida settings. Si un campo no viene, mantiene el valor previo
 * (o el default si no hay previo). Devuelve { settings } u { error }.
 */
export function parseSettings(
  input: GroupSettingsInput,
  previous: GroupSettings = defaultSettings()
): { settings: GroupSettings } | { error: string } {
  const out: GroupSettings = { ...previous };

  if (input.description !== undefined) {
    const s = asString(input.description);
    if (s === undefined) return { error: "Descripción inválida" };
    const trimmed = s.trim();
    if (trimmed.length > 500)
      return { error: "Descripción demasiado larga (máx. 500 caracteres)" };
    out.description = trimmed === "" ? null : trimmed;
  }

  if (input.predictionLockMode !== undefined) {
    const s = asString(input.predictionLockMode);
    if (!s || !(LOCK_MODES as readonly string[]).includes(s)) {
      return { error: "Modo de cierre de predicciones inválido" };
    }
    out.predictionLockMode = s as GroupSettings["predictionLockMode"];
  }

  if (input.lockMinutesBefore !== undefined) {
    const n = Number(input.lockMinutesBefore);
    if (!Number.isInteger(n) || n < 0 || n > 1440) {
      return {
        error: "Minutos antes del cierre debe ser un entero entre 0 y 1440",
      };
    }
    out.lockMinutesBefore = n;
  }

  if (input.joinPolicy !== undefined) {
    const s = asString(input.joinPolicy);
    if (!s || !(JOIN_POLICIES as readonly string[]).includes(s)) {
      return { error: "Política de inscripción inválida" };
    }
    out.joinPolicy = s as GroupSettings["joinPolicy"];
  }

  if (input.joinDeadline !== undefined) {
    if (input.joinDeadline === null || input.joinDeadline === "") {
      out.joinDeadline = null;
    } else {
      const s = asString(input.joinDeadline);
      if (!s) return { error: "Fecha límite inválida" };
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) {
        return { error: "Fecha límite inválida" };
      }
      out.joinDeadline = d;
    }
  }

  if (input.allowLateJoin !== undefined) {
    out.allowLateJoin = Boolean(input.allowLateJoin);
  }

  if (input.predictionsVisibility !== undefined) {
    const s = asString(input.predictionsVisibility);
    if (!s || !(VISIBILITIES as readonly string[]).includes(s)) {
      return { error: "Visibilidad de pronósticos inválida" };
    }
    out.predictionsVisibility = s as GroupSettings["predictionsVisibility"];
  }

  return { settings: out };
}
