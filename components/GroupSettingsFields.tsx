"use client";

import { useId } from "react";
import { useI18n } from "@/providers/I18nProvider";

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
  const { t } = useI18n();

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
          {t.groupSettings.descriptionLabel}
        </label>
        <textarea
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={500}
          rows={3}
          disabled={disabled}
          className="input-base w-full resize-none"
          placeholder={t.groupSettings.descriptionPlaceholder}
        />
        <p className="mt-1 font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
          {t.groupSettings.descriptionCounter.replace("{count}", String(value.description.length))}
        </p>
      </div>

      {/* Cierre de predicciones */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          {t.groupSettings.lockWhen}
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-lock`}
            checked={value.predictionLockMode === "per-match"}
            onChange={() => update("predictionLockMode", "per-match")}
            disabled={disabled}
            label={t.groupSettings.lockPerMatch}
            help={t.groupSettings.lockPerMatchHelp}
          />
          {value.predictionLockMode === "per-match" && (
            <div className="ml-7 mt-2 flex items-center gap-2">
              <span className="font-mono text-[11px] text-pitch-700 dark:text-chalk-300 uppercase tracking-widest">
                {t.groupSettings.lockCloseMinutes}
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
              <span className="font-mono text-[11px] text-pitch-700 dark:text-chalk-300 uppercase tracking-widest">
                {t.groupSettings.lockMinutesBefore}
              </span>
            </div>
          )}
          <Radio
            name={`${id}-lock`}
            checked={value.predictionLockMode === "tournament-start"}
            onChange={() => update("predictionLockMode", "tournament-start")}
            disabled={disabled}
            label={t.groupSettings.lockTournamentStart}
            help={t.groupSettings.lockTournamentStartHelp}
          />
        </div>
      </fieldset>

      {/* Política de inscripción */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          {t.groupSettings.joinPolicy}
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "open"}
            onChange={() => update("joinPolicy", "open")}
            disabled={disabled}
            label={t.groupSettings.joinOpen}
            help={t.groupSettings.joinOpenHelp}
          />
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "approval"}
            onChange={() => update("joinPolicy", "approval")}
            disabled={disabled}
            label={t.groupSettings.joinApproval}
            help={t.groupSettings.joinApprovalHelp}
          />
          <Radio
            name={`${id}-join`}
            checked={value.joinPolicy === "closed"}
            onChange={() => update("joinPolicy", "closed")}
            disabled={disabled}
            label={t.groupSettings.joinClosed}
            help={t.groupSettings.joinClosedHelp}
          />
        </div>
        <div className="mt-4">
          <label className="block text-xs font-display uppercase tracking-widest text-flame-400 mb-2">
            {t.groupSettings.joinDeadlineLabel}
          </label>
          <input
            type="datetime-local"
            value={value.joinDeadline}
            onChange={(e) => update("joinDeadline", e.target.value)}
            disabled={disabled}
            className="input-base w-full"
          />
          <p className="mt-1 font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest">
            {t.groupSettings.joinDeadlineHelp}
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
            <div className="font-display text-sm uppercase tracking-tight text-pitch-900 dark:text-chalk-50">
              {t.groupSettings.allowLateJoin}
            </div>
            <div className="font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mt-0.5">
              {t.groupSettings.allowLateJoinHelp}
            </div>
          </div>
        </label>
      </fieldset>

      {/* Visibilidad */}
      <fieldset>
        <legend className="text-xs font-display uppercase tracking-widest text-flame-400 mb-3">
          {t.groupSettings.visibilityLabel}
        </legend>
        <div className="space-y-2">
          <Radio
            name={`${id}-vis`}
            checked={value.predictionsVisibility === "hidden-until-lock"}
            onChange={() => update("predictionsVisibility", "hidden-until-lock")}
            disabled={disabled}
            label={t.groupSettings.visibilityHidden}
            help={t.groupSettings.visibilityHiddenHelp}
          />
          <Radio
            name={`${id}-vis`}
            checked={value.predictionsVisibility === "open"}
            onChange={() => update("predictionsVisibility", "open")}
            disabled={disabled}
            label={t.groupSettings.visibilityOpen}
            help={t.groupSettings.visibilityOpenHelp}
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
        <div className="font-display text-sm uppercase tracking-tight text-pitch-900 dark:text-chalk-50">
          {label}
        </div>
        {help && (
          <div className="font-mono text-[10px] text-pitch-500 dark:text-chalk-400 uppercase tracking-widest mt-0.5">
            {help}
          </div>
        )}
      </div>
    </label>
  );
}
