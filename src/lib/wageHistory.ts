export interface WageHistoryAllowance {
  label: string;
  value: number;
  type?: 'amount' | 'percent';
}

export interface WageHistoryLike {
  basic?: number | string | null;
  otherAllowance?: number | string | { value: number | string; type?: 'amount' | 'percent' } | null;
  allowances?: WageHistoryAllowance[] | null;
  effectiveFrom?: string | Date | null;
  configuredEffectiveTo?: string | Date | null;
  effectiveTo?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface ResolvedWageTimelineEntry<T extends WageHistoryLike> {
  wage: T;
  effectiveFrom: Date;
  configuredEffectiveTo: Date | null;
  effectiveTo: Date | null;
}

function toAmount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

function normalizeLabel(value: unknown): string {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function toWageDateString(value?: string | Date | null): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  return value.toISOString().split("T")[0];
}

export function toWageDate(value?: string | Date | null, fallback?: string | Date | null) {
  const normalizedValue = toWageDateString(value) || toWageDateString(fallback);
  if (!normalizedValue) {
    return new Date();
  }

  return new Date(`${normalizedValue}T00:00:00.000Z`);
}

export function normalizeWageAllowances(input: unknown): WageHistoryAllowance[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => ({
      label: normalizeLabel((entry as { label?: unknown })?.label),
      value: toAmount((entry as { value?: unknown })?.value),
      type: (entry as any).type || 'amount',
    }))
    .filter((entry) => entry.label);
}

export function normalizeWageSnapshot(input?: WageHistoryLike | null) {
  const basic = toAmount(input?.basic);
  const otherRaw = input?.otherAllowance;
  let otherAllowance = 0;
  let otherType: 'amount' | 'percent' = 'amount';

  if (typeof otherRaw === 'object' && otherRaw !== null) {
    otherAllowance = toAmount((otherRaw as any).value);
    otherType = (otherRaw as any).type || 'amount';
  } else {
    otherAllowance = toAmount(otherRaw);
  }

  return {
    basic,
    otherAllowance,
    otherType,
    allowances: normalizeWageAllowances(input?.allowances).sort((left, right) =>
      left.label.localeCompare(right.label),
    ),
  };
}

export function areWageSnapshotsEqual(
  left?: WageHistoryLike | null,
  right?: WageHistoryLike | null,
) {
  const normalizedLeft = normalizeWageSnapshot(left);
  const normalizedRight = normalizeWageSnapshot(right);

  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

export function getWageTotal(input?: WageHistoryLike | null) {
  const snapshot = normalizeWageSnapshot(input);
  const basic = snapshot.basic;

  const otherCalculated = snapshot.otherType === 'percent' 
    ? (basic * (snapshot.otherAllowance / 100)) 
    : snapshot.otherAllowance;

  const allowancesCalculated = snapshot.allowances.reduce((sum, item) => {
    const val = item.type === 'percent' ? (basic * (item.value / 100)) : item.value;
    return sum + val;
  }, 0);

  return Number(
    (basic + otherCalculated + allowancesCalculated).toFixed(2),
  );
}

export function pickLatestWage<T extends WageHistoryLike>(wages: T[]): T | null {
  if (!wages.length) return null;

  return [...wages].sort((left, right) => {
    const leftKey = toWageDateString(left.effectiveFrom || left.createdAt);
    const rightKey = toWageDateString(right.effectiveFrom || right.createdAt);

    if (leftKey === rightKey) {
      const leftCreated = toWageDateString(left.createdAt);
      const rightCreated = toWageDateString(right.createdAt);
      return rightCreated.localeCompare(leftCreated);
    }

    return rightKey.localeCompare(leftKey);
  })[0];
}

export function pickWageForDate<T extends WageHistoryLike>(
  wages: T[],
  referenceDate: string | Date,
): T | null {
  const normalizedReference = toWageDate(referenceDate);

  const matches = wages.filter((wage) => {
    const effectiveFrom = toWageDate(wage.effectiveFrom || wage.createdAt);
    const effectiveTo = wage.effectiveTo ? toWageDate(wage.effectiveTo) : null;

    return (
      effectiveFrom.getTime() <= normalizedReference.getTime() &&
      (!effectiveTo || effectiveTo.getTime() >= normalizedReference.getTime())
    );
  });

  return matches.length ? pickLatestWage(matches) : null;
}

function compareWageTimelineEntries<T extends WageHistoryLike>(left: T, right: T) {
  const leftKey = toWageDateString(left.effectiveFrom || left.createdAt);
  const rightKey = toWageDateString(right.effectiveFrom || right.createdAt);

  if (leftKey === rightKey) {
    const leftCreated = toWageDateString(left.createdAt);
    const rightCreated = toWageDateString(right.createdAt);
    return leftCreated.localeCompare(rightCreated);
  }

  return leftKey.localeCompare(rightKey);
}

export function getPreviousDay(value: string | Date) {
  const nextDate = toWageDate(value);
  nextDate.setUTCDate(nextDate.getUTCDate() - 1);
  return nextDate;
}

export function resolveWageEffectiveTo(input: {
  configuredEffectiveTo?: string | Date | null;
  fallbackEffectiveTo?: string | Date | null;
  nextEffectiveFrom?: string | Date | null;
}) {
  const hasConfiguredEffectiveTo = input.configuredEffectiveTo !== undefined;
  const baseEffectiveTo = hasConfiguredEffectiveTo
    ? toWageDateString(input.configuredEffectiveTo)
    : toWageDateString(input.fallbackEffectiveTo);
  const nextStart = input.nextEffectiveFrom
    ? getPreviousDay(input.nextEffectiveFrom)
    : null;

  if (!baseEffectiveTo && !nextStart) {
    return null;
  }

  const baseDate = baseEffectiveTo ? toWageDate(baseEffectiveTo) : null;
  if (!baseDate) {
    return nextStart;
  }

  if (!nextStart) {
    return baseDate;
  }

  return baseDate.getTime() <= nextStart.getTime() ? baseDate : nextStart;
}

export function resolveWageTimeline<T extends WageHistoryLike>(
  wages: T[],
): ResolvedWageTimelineEntry<T>[] {
  const sortedWages = [...wages].sort(compareWageTimelineEntries);

  return sortedWages.map((wage, index) => {
    const effectiveFrom = toWageDate(wage.effectiveFrom || wage.createdAt);
    const configuredEffectiveToKey =
      wage.configuredEffectiveTo !== undefined
        ? toWageDateString(wage.configuredEffectiveTo)
        : "";
    const configuredEffectiveTo = configuredEffectiveToKey
      ? toWageDate(configuredEffectiveToKey)
      : null;
    const nextWage = sortedWages[index + 1];
    const effectiveTo = resolveWageEffectiveTo({
      configuredEffectiveTo:
        wage.configuredEffectiveTo !== undefined
          ? wage.configuredEffectiveTo
          : undefined,
      fallbackEffectiveTo:
        wage.configuredEffectiveTo === undefined ? wage.effectiveTo : undefined,
      nextEffectiveFrom: nextWage?.effectiveFrom || nextWage?.createdAt || null,
    });

    return {
      wage,
      effectiveFrom,
      configuredEffectiveTo,
      effectiveTo,
    };
  });
}

function formatTimelineDate(value: Date) {
  return toWageDateString(value);
}

export function validateWageTimeline<T extends WageHistoryLike>(
  wages: T[],
): ResolvedWageTimelineEntry<T>[] {
  const resolvedTimeline = resolveWageTimeline(wages);

  for (let index = 0; index < resolvedTimeline.length; index += 1) {
    const current = resolvedTimeline[index];
    const next = resolvedTimeline[index + 1];

    if (
      current.configuredEffectiveTo &&
      current.configuredEffectiveTo.getTime() < current.effectiveFrom.getTime()
    ) {
      throw new Error(
        `Salary effective end date cannot be before ${formatTimelineDate(
          current.effectiveFrom,
        )}.`,
      );
    }

    if (
      current.effectiveTo &&
      current.effectiveTo.getTime() < current.effectiveFrom.getTime()
    ) {
      if (
        next &&
        next.effectiveFrom.getTime() === current.effectiveFrom.getTime()
      ) {
        throw new Error(
          `Another salary period already starts on ${formatTimelineDate(
            current.effectiveFrom,
          )}.`,
        );
      }

      throw new Error(
        `Salary period ${formatTimelineDate(
          current.effectiveFrom,
        )} to ${formatTimelineDate(current.effectiveTo)} is invalid.`,
      );
    }
  }

  return resolvedTimeline;
}

export function assertNoWagePeriodOverlap<
  T extends WageHistoryLike & { _id?: unknown },
>(input: {
  wages: T[];
  candidate: {
    effectiveFrom?: string | Date | null;
    effectiveTo?: string | Date | null;
    configuredEffectiveTo?: string | Date | null;
    _id?: unknown;
  };
  ignoreWageId?: string;
}) {
  const candidateFrom = toWageDate(
    input.candidate.effectiveFrom,
    input.candidate.effectiveFrom,
  );
  const candidateToKey =
    toWageDateString(input.candidate.configuredEffectiveTo) ||
    toWageDateString(input.candidate.effectiveTo);
  const candidateTo = candidateToKey ? toWageDate(candidateToKey) : null;
  const candidateEndTime = candidateTo?.getTime() ?? Number.POSITIVE_INFINITY;
  const resolvedTimeline = resolveWageTimeline(input.wages);

  for (const entry of resolvedTimeline) {
    const entryId = String((entry.wage as { _id?: unknown })._id || "");
    if (input.ignoreWageId && entryId === input.ignoreWageId) {
      continue;
    }

    const existingFromTime = entry.effectiveFrom.getTime();
    const existingToTime =
      entry.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;
    const overlaps =
      candidateFrom.getTime() <= existingToTime &&
      existingFromTime <= candidateEndTime;

    if (!overlaps) {
      continue;
    }

    const canSplitOpenEndedLatestPeriod =
      entry.effectiveTo === null &&
      entry.configuredEffectiveTo === null &&
      candidateFrom.getTime() > existingFromTime;

    if (canSplitOpenEndedLatestPeriod) {
      continue;
    }

    const existingToLabel = entry.effectiveTo
      ? formatTimelineDate(entry.effectiveTo)
      : "Present";
    throw new Error(
      `Payscale period overlaps with existing period ${formatTimelineDate(
        entry.effectiveFrom,
      )} to ${existingToLabel}.`,
    );
  }
}
