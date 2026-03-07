// ─── Roadmap Types ────────────────────────────────────────────────────────────

export type Task = {
  id: string;
  label: string;
  prerequisite?: string; // taskId that must be complete before this unlocks
};

export type LeafNode = {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
};

export type BranchNode = {
  id: string;
  label: string;
  color: string;
  children: LeafNode[];
};

export type RoadmapData = {
  id: string;
  label: string;
  children: BranchNode[];
};

// ─── Progress Types ───────────────────────────────────────────────────────────

export type ProgressMap = Record<string, boolean>; // key: taskId, value: completed

export type NodeProgress = {
  done: number;
  total: number;
  pct: number; // 0–100
};

// ─── User / Profile Types ─────────────────────────────────────────────────────

export type IncomeRange =
  | "under-20k"
  | "20k-40k"
  | "40k-60k"
  | "60k-80k"
  | "80k-100k"
  | "over-100k";

export type Province =
  | "AB" | "BC" | "MB" | "NB" | "NL"
  | "NS" | "NT" | "NU" | "ON" | "PE"
  | "QC" | "SK" | "YT";

export type LifeSituation =
  | "employed"
  | "student"
  | "renter"
  | "has-debt"
  | "has-car"
  | "lives-with-parents"
  | "files-taxes"
  | "no-employer-benefits";

export type UserProfile = {
  age?: number;
  province?: Province;
  incomeRange?: IncomeRange;
  situations: LifeSituation[];
};

// ─── Benefits / Actions Types ─────────────────────────────────────────────────

export type Benefit = {
  id: string;
  title: string;
  description: string;
  estimatedValue: string;
  eligibility: LifeSituation[];
  province: Province | "all";
  officialLink: string;
  category: "government_benefit" | "tax_credit" | "account" | "action";
  tags: string[];
};

export type Action = {
  id: string;
  title: string;
  reason: string;
  appliesTo: LifeSituation[];
  urgency: "high" | "medium" | "low";
};