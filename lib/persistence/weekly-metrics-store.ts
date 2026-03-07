const WEEKLY_METRICS_STORAGE_KEY_PREFIX = "maplemind_weekly_metrics_v1";
const MAX_WEEKS_TO_KEEP = 26;

export interface WeeklyMetricsEntry {
  weekStart: string;
  baselineCompletedActions: number;
  currentCompletedActions: number;
  completedActions: number;
  baselineScore: number;
  currentScore: number;
  scoreChange: number;
  knownBenefitIds: string[];
  discoveredBenefitIds: string[];
  discoveredBenefits: number;
  updatedAt: string;
}

export interface WeeklyMetricsSummary {
  entries: WeeklyMetricsEntry[];
}

export interface WeeklyMetricsSnapshot {
  completedActionCount: number;
  adultScore: number;
  benefitIds: string[];
}

function getStorageKey(userId: string): string {
  return `${WEEKLY_METRICS_STORAGE_KEY_PREFIX}:${userId}`;
}

function normalizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function dedupeIds(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim())));
}

function getWeekStart(date: Date): string {
  const localDay = date.getDay();
  const difference = localDay === 0 ? -6 : 1 - localDay;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() + difference);
  return monday.toISOString().slice(0, 10);
}

function loadSummary(userId: string): WeeklyMetricsSummary {
  if (typeof window === "undefined") {
    return { entries: [] };
  }

  const rawValue = localStorage.getItem(getStorageKey(userId));
  if (!rawValue) {
    return { entries: [] };
  }

  try {
    const parsed = JSON.parse(rawValue) as WeeklyMetricsSummary;
    if (!parsed || !Array.isArray(parsed.entries)) {
      return { entries: [] };
    }

    return {
      entries: parsed.entries.filter((entry): entry is WeeklyMetricsEntry => {
        return Boolean(entry && typeof entry.weekStart === "string");
      }),
    };
  } catch {
    return { entries: [] };
  }
}

function saveSummary(userId: string, summary: WeeklyMetricsSummary): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getStorageKey(userId), JSON.stringify(summary));
}

export function loadWeeklyMetricsSummary(userId: string): WeeklyMetricsSummary {
  return loadSummary(userId);
}

export function recordWeeklyMetrics(userId: string, snapshot: WeeklyMetricsSnapshot): WeeklyMetricsSummary {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const currentCompletedActions = normalizeCount(snapshot.completedActionCount);
  const currentScore = normalizeScore(snapshot.adultScore);
  const currentBenefitIds = dedupeIds(snapshot.benefitIds);
  const nowIso = now.toISOString();

  const summary = loadSummary(userId);
  const entries = [...summary.entries];
  const existingIndex = entries.findIndex((entry) => entry.weekStart === weekStart);

  if (existingIndex < 0) {
    entries.push({
      weekStart,
      baselineCompletedActions: currentCompletedActions,
      currentCompletedActions,
      completedActions: 0,
      baselineScore: currentScore,
      currentScore,
      scoreChange: 0,
      knownBenefitIds: currentBenefitIds,
      discoveredBenefitIds: [],
      discoveredBenefits: 0,
      updatedAt: nowIso,
    });
  } else {
    const current = entries[existingIndex];
    const seenBenefitIds = new Set<string>([...current.knownBenefitIds, ...current.discoveredBenefitIds]);
    const newBenefitIds = currentBenefitIds.filter((benefitId) => !seenBenefitIds.has(benefitId));
    const discoveredBenefitIds = dedupeIds([...current.discoveredBenefitIds, ...newBenefitIds]);

    entries[existingIndex] = {
      ...current,
      currentCompletedActions,
      completedActions: Math.max(0, currentCompletedActions - current.baselineCompletedActions),
      currentScore,
      scoreChange: currentScore - current.baselineScore,
      discoveredBenefitIds,
      discoveredBenefits: discoveredBenefitIds.length,
      updatedAt: nowIso,
    };
  }

  const normalizedEntries = entries
    .sort((first, second) => second.weekStart.localeCompare(first.weekStart))
    .slice(0, MAX_WEEKS_TO_KEEP);

  const nextSummary: WeeklyMetricsSummary = { entries: normalizedEntries };
  saveSummary(userId, nextSummary);
  return nextSummary;
}
