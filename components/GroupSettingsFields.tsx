"use client";

import { useId } from "react";

export type GroupSettingsValue = {
  description: string;
  predictionLockMode: "per-match" | "tournament-start";
  lockMinutesBefore: number;
  joinPolicy: "open" | "approval" | "closed";
  joinDeadline: string; // datetime-local string, vacío si no hay
  allowLateJoin: boolean;
  predictionsVisibility: "hidden-until-lock" | "open";
};

export const DEFAULT_SETTINGS: GroupSettingsValue = {
  description: "",
  predictionLockMode: "per-match",
  lockMinutesBefore: 0,
  joinPolicy: "open",
  joinDeadline: "",
  allowLateJoin: false,
  predictionsVisibility: "hidden-until-lock",
};

/**
 * Convierte el shape del cliente al payload JSON que esperan
 * POST /api/groups y PATCH /api/groups/[slug] (vía lib/group-settings).
 */
export function settingsToPayload(v: GroupSettingsValue) {
  return {
    description: v.description.trim(),
    predictionLockMode: v.predictionLockMode,
    lockMinutesBefore:
      v.predictionLockMode === "per-match" ? v.lockMinutesBefore : 0,
    joinPolicy: v.joinPolicy,
    joinDeadline: v.joinDeadline ? new Date(v.joinDeadline).toISOString() : null,
    allowLateJoin: v.allowLateJoin,
    predictionsVisibility: v.predictionsVisibility,
  };
}

export default function GroupSettingsFields({
  value,
  onChange,
  disabled,
}: {
  value: GroupSettingsValue;
  onChange: (next: GroupSettingsValue) => void;
  disabled?: boolean;
}) {
  const id = useId();

  function update<K extends keyof GroupSettingsValue>(
    key: K,
    val: GroupSettingsValue[K]
  ) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-6">
      {/* Descripción */}
      <div>
        <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
          Descripción / Reglas (opcional)
        </label>
        <textarea
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={500}
          rows={3}
          disabled={disabled}
          className="input-base w-full resize-none"
          placeholder='Ej: "Pago 5€ al ganador. Empate: comparte bote."'
        />
        <p className="mt-1 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
          {value.description.length}/500
        </p>
      </div>

      {/* Cierre de predicciones */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          ¿Cuándo se cierran las predicciones?
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-lock`}
            checked={value.predictionLockMode === "per-match"}
            onChange={() => update("predictionLockMode", "per-match")}
            disabled={disabled}
            label="Por partido"
            help="Cada partido se cierra individualmente al empezar."
          />
          {value.predictionLockMode === "per-match" && (
            <div className="ml-7 mt-2 flex items-center gap-2">
              <span className="font-mono text-[11px] text-chalk-300 uppercase tracking-widest">
                Cerrar
              </span>
              <input
                type="number"
                min={0}
                max={1440}
                value={value.lockMinutesBefore}
                onChange={(e) =>
                  update(
                    "lockMinutesBefore",
                    Math.max(
                      0,
                      Math.min(1440, parseInt(e.target.value, 10) || 0)
                    )
                  )
                }
                disabled={disabled}
                className="input-base w-20 text-center"
              />
              <span className="font-mono text-[11px] text-chalk-300 uppercase tracking-widest">
                min antes del kickoff
              </span>
            </div>
          )}
          <Radio
            name={`${id}-lock`}
            checked={value.predictionLockMode === "tournament-start"}
            onChange={() => update("predictionLockMode", "tournament-start")}
            disabled={disabled}
            label="Al empezar el torneo"
            help="Modo quiniela: todo se cierra con el primer partido."
          />
        </div>
      </fieldset>

      {/* Política de inscripción */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          ¿Quién puede entrar al grupo?
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "open"}
            onChange={() => update("joinPolicy", "open")}
            disabled={disabled}
            label="Abierto"
            help="Cualquiera con el enlace de invitación puede unirse."
          />
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "approval"}
            onChange={() => update("joinPolicy", "approval")}
            disabled={disabled}
            label="Con aprobación"
            help="El owner aprueba a cada solicitante manualmente."
          />
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "closed"}
            onChange={() => update("joinPolicy", "closed")}
            disabled={disabled}
            label="Cerrado"
            help="Nadie más puede unirse, ni con el enlace."
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            Plazo límite de inscripción (opcional)
          </label>
          <input
            type="datetime-local"
            value={value.joinDeadline}
            onChange={(e) => update("joinDeadline", e.target.value)}
            disabled={disabled}
            className="input-base w-full"
          />
          <p className="mt-1 font-mono text-[10px] text-chalk-400 uppercase tracking-widest">
            Después de esta fecha no se admitirán nuevas inscripciones.
          </p>
        </div>

        <label
          className={`mt-4 flex items-start gap-3 cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={value.allowLateJoin}
            onChange={(e) => update("allowLateJoin", e.target.checked)}
            disabled={disabled}
            className="mt-1 w-4 h-4 accent-flame-500 cursor-pointer"
          />
          <div className="flex-1">
            <div className="font-display text-sm uppercase tracking-tight text-chalk-50">
              Permitir entradas después de que arranque el torneo
            </div>
            <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-0.5">
              Por defecto, una vez empieza el torneo no se admiten más miembros.
              Activa esto si quieres que la gente se pueda apuntar tarde.
            </div>
          </div>
        </label>
      </fieldset>

      {/* Visibilidad */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          ¿Cuándo se ven los pronósticos del resto?
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-vis`}
            checked={value.predictionsVisibility === "hidden-until-lock"}
            onChange={() => update("predictionsVisibility", "hidden-until-lock")}
            disabled={disabled}
            label="Ocultos hasta el cierre"
            help="Solo se ven cuando el torneo arranca (por defecto)."
          />
          <Radio
            name={`${id}-vis`}
            checked={value.predictionsVisibility === "open"}
            onChange={() => update("predictionsVisibility", "open")}
            disabled={disabled}
            label="Siempre visibles"
            help="Cualquier miembro puede ver los pronósticos del resto en cualquier momento."
          />
        </div>
      </fieldset>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  disabled,
  label,
  help,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
  help?: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1.5 w-4 h-4 accent-flame-500 cursor-pointer"
      />
      <div className="flex-1">
        <div className="font-display text-sm uppercase tracking-tight text-chalk-50">
          {label}
        </div>
        {help && (
          <div className="font-mono text-[10px] text-chalk-400 uppercase tracking-widest mt-0.5">
            {help}
          </div>
        )}
      </div>
    </label>
  );
}
