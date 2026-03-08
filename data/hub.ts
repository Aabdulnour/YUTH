import type { ProfileMatchConditions } from "@/types/profile";

/* ── Hub item types ── */

export type HubCategory =
  | "banking"
  | "investing"
  | "credit"
  | "housing"
  | "insurance"
  | "student"
  | "tax"
  | "debt"
  | "cashflow";

export const HUB_CATEGORY_LABELS: Record<HubCategory, string> = {
  banking: "Banking",
  investing: "Investing & Savings",
  credit: "Credit Building",
  housing: "Housing",
  insurance: "Insurance",
  student: "Student Resources",
  tax: "Tax",
  debt: "Debt Management",
  cashflow: "Cashflow Tools",
};

export const HUB_CATEGORY_ICONS: Record<HubCategory, string> = {
  banking: "🏦",
  investing: "📈",
  credit: "📊",
  housing: "🏠",
  insurance: "🛡️",
  student: "🎓",
  tax: "🧾",
  debt: "💳",
  cashflow: "📋",
};

export interface HubItem {
  id: string;
  title: string;
  provider: string;
  category: HubCategory;
  description: string;
  whyItMatters: string;
  ctaLabel: string;
  ctaUrl: string;
  featured: boolean;
  matchConditions: ProfileMatchConditions;
  provinceRelevance?: string[];
}

/* ── Curated hub items ── */

export const HUB_ITEMS: HubItem[] = [
  // ── Banking ──
  {
    id: "hub_eq_bank",
    title: "EQ Bank Savings Plus",
    provider: "EQ Bank",
    category: "banking",
    description: "High-interest everyday savings with no monthly fees. Earn interest on every dollar from day one.",
    whyItMatters: "A no-fee bank account that actually pays you interest can save hundreds per year.",
    ctaLabel: "Learn More",
    ctaUrl: "https://www.eqbank.ca",
    featured: true,
    matchConditions: {},
  },
  {
    id: "hub_simplii",
    title: "Simplii No Fee Chequing",
    provider: "Simplii Financial",
    category: "banking",
    description: "Free chequing account with no monthly fees, free e-Transfers, and a free credit card.",
    whyItMatters: "Eliminating bank fees is one of the easiest wins for young adults on a budget.",
    ctaLabel: "Explore",
    ctaUrl: "https://www.simplii.com",
    featured: false,
    matchConditions: {},
  },
  {
    id: "hub_wealthsimple_cash",
    title: "Wealthsimple Cash",
    provider: "Wealthsimple",
    category: "banking",
    description: "Hybrid spending and savings account with high interest and instant transfers.",
    whyItMatters: "Combines spending simplicity with savings growth in one account.",
    ctaLabel: "Get Started",
    ctaUrl: "https://www.wealthsimple.com/cash",
    featured: false,
    matchConditions: {},
  },

  // ── Savings ──
  {
    id: "hub_fhsa",
    title: "First Home Savings Account",
    provider: "Government of Canada",
    category: "investing",
    description: "Tax-deductible contributions and tax-free withdrawals for buying your first home. Up to $8,000/year.",
    whyItMatters: "Combines RRSP-style deductions with TFSA-style withdrawals — the best of both worlds.",
    ctaLabel: "Learn About FHSA",
    ctaUrl: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
    featured: true,
    matchConditions: { renter: true },
  },
  {
    id: "hub_tfsa_wealthsimple",
    title: "TFSA Investing",
    provider: "Wealthsimple",
    category: "investing",
    description: "Start investing tax-free with as little as $1. Automated portfolio management included.",
    whyItMatters: "Every year you don't use your TFSA room, you lose tax-free growth potential.",
    ctaLabel: "Open a TFSA",
    ctaUrl: "https://www.wealthsimple.com/tfsa",
    featured: false,
    matchConditions: { employed: true },
  },
  {
    id: "hub_emergency_fund",
    title: "High-Interest Emergency Fund",
    provider: "Multiple Providers",
    category: "investing",
    description: "Build your safety net in a high-interest savings account. Aim for 3 months of expenses.",
    whyItMatters: "83% of Canadians don't have enough saved for a $1,000 emergency. Don't be one of them.",
    ctaLabel: "Compare Rates",
    ctaUrl: "https://www.ratehub.ca/savings-accounts/accounts/high-interest",
    featured: true,
    matchConditions: { hasEmergencySavings: false },
  },

  // ── Credit Building ──
  {
    id: "hub_credit_score",
    title: "Free Credit Score Check",
    provider: "Borrowell",
    category: "credit",
    description: "Check your credit score for free — no impact, no catch. Updated weekly.",
    whyItMatters: "Your credit score affects rent applications, loan rates, and even phone plans.",
    ctaLabel: "Check Your Score",
    ctaUrl: "https://www.borrowell.com",
    featured: true,
    matchConditions: {},
  },
  {
    id: "hub_secured_card",
    title: "Secured Credit Card",
    provider: "Neo Financial",
    category: "credit",
    description: "Build credit with a secured card — no credit history required. Earn cashback on purchases.",
    whyItMatters: "A secured card is the safest way to start building credit from scratch.",
    ctaLabel: "Apply Now",
    ctaUrl: "https://www.neofinancial.com",
    featured: false,
    matchConditions: { isNewcomer: true },
  },
  {
    id: "hub_credit_builder",
    title: "Credit Building Program",
    provider: "KOHO",
    category: "credit",
    description: "Build credit through regular spending without a credit check or interest charges.",
    whyItMatters: "Good credit opens doors — from apartments to lower insurance premiums.",
    ctaLabel: "Start Building",
    ctaUrl: "https://www.koho.ca/credit-building",
    featured: false,
    matchConditions: { hasDebt: true },
  },

  // ── Housing ──
  {
    id: "hub_rent_reports",
    title: "Rent Reporting for Credit",
    provider: "FrontLobby",
    category: "housing",
    description: "Report your rent payments to Equifax and build credit from rent you're already paying.",
    whyItMatters: "You're paying rent anyway — make it work for your credit score.",
    ctaLabel: "Report Your Rent",
    ctaUrl: "https://www.frontlobby.com",
    featured: false,
    matchConditions: { renter: true },
  },
  {
    id: "hub_tenant_rights",
    title: "Know Your Tenant Rights",
    provider: "Government Resources",
    category: "housing",
    description: "Province-specific guides to your rights as a renter — deposits, evictions, and repairs.",
    whyItMatters: "Many young renters don't know their rights, which landlords sometimes exploit.",
    ctaLabel: "Read Your Rights",
    ctaUrl: "https://www.cmhc-schl.gc.ca/consumers/renting-a-home",
    featured: false,
    matchConditions: { renter: true },
  },
  {
    id: "hub_first_home_guide",
    title: "First-Time Buyer Guide",
    provider: "CMHC",
    category: "housing",
    description: "Step-by-step guide to buying your first home in Canada — from saving to closing.",
    whyItMatters: "The homebuying process is complex. A clear guide prevents costly mistakes.",
    ctaLabel: "Start Planning",
    ctaUrl: "https://www.cmhc-schl.gc.ca/consumers/home-buying",
    featured: false,
    matchConditions: { livesWithParents: true },
  },

  // ── Insurance ──
  {
    id: "hub_insurance_compare",
    title: "Compare Insurance Rates",
    provider: "LowestRates.ca",
    category: "insurance",
    description: "Compare auto, tenant, and life insurance quotes from multiple providers in minutes.",
    whyItMatters: "Many young adults overpay for insurance or skip it entirely — both are risky.",
    ctaLabel: "Compare Rates",
    ctaUrl: "https://www.lowestrates.ca",
    featured: false,
    matchConditions: { hasCar: true },
  },
  {
    id: "hub_tenant_insurance",
    title: "Tenant Insurance",
    provider: "Square One",
    category: "insurance",
    description: "Affordable renter's insurance starting from $12/month. Covers belongings, liability, and more.",
    whyItMatters: "If you rent, your landlord's insurance won't cover your stuff. Tenant insurance is cheap protection.",
    ctaLabel: "Get a Quote",
    ctaUrl: "https://www.squareone.ca",
    featured: false,
    matchConditions: { renter: true },
  },

  // ── Student Resources ──
  {
    id: "hub_student_aid",
    title: "Apply for Student Aid",
    provider: "Government of Canada",
    category: "student",
    description: "Federal and provincial student grants and loans — including non-repayable grants up to $6,000.",
    whyItMatters: "Thousands of dollars in free grants go unclaimed every year because students don't apply.",
    ctaLabel: "Check Eligibility",
    ctaUrl: "https://www.canada.ca/en/services/benefits/education/student-aid.html",
    featured: true,
    matchConditions: { student: true },
  },
  {
    id: "hub_unibuddy",
    title: "Student Budget Calculator",
    provider: "YUTH",
    category: "student",
    description: "Plan your semester budget with tuition, housing, food, and entertainment all accounted for.",
    whyItMatters: "Most students underestimate costs. A realistic budget prevents mid-semester financial stress.",
    ctaLabel: "Plan Your Budget",
    ctaUrl: "/ask-ai",
    featured: false,
    matchConditions: { student: true, isPostSecondary: true },
  },
  {
    id: "hub_tuition_credits",
    title: "Claim Tuition Tax Credits",
    provider: "CRA",
    category: "student",
    description: "Get your T2202 from your school and claim tuition amounts — save or transfer credits.",
    whyItMatters: "Tuition credits reduce your tax bill and can be carried forward for years.",
    ctaLabel: "Learn How",
    ctaUrl: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-32300-your-tuition-education-textbook-amounts.html",
    featured: false,
    matchConditions: { student: true },
  },

  // ── Newcomer Resources ──
  {
    id: "hub_newcomer_checklist",
    title: "Newcomer Financial Setup",
    provider: "Settlement.org",
    category: "housing",
    description: "SIN, bank account, credit history, health card — a complete first-90-days financial checklist.",
    whyItMatters: "The right setup in your first months in Canada creates a strong financial foundation.",
    ctaLabel: "Get Started",
    ctaUrl: "https://settlement.org/ontario/employment/newcomers-in-the-workplace/",
    featured: true,
    matchConditions: { isNewcomer: true },
  },
  {
    id: "hub_newcomer_banking",
    title: "Newcomer Banking Package",
    provider: "TD Bank",
    category: "banking",
    description: "Bank account with no monthly fees for 1 year, plus a no-annual-fee credit card.",
    whyItMatters: "Most banks offer newcomer packages — using one avoids unnecessary fees while you settle in.",
    ctaLabel: "Explore Package",
    ctaUrl: "https://www.td.com/ca/en/personal-banking/solutions/newcomers-to-canada",
    featured: false,
    matchConditions: { isNewcomer: true },
  },

  // ── Budgeting Tools ──
  {
    id: "hub_mint_alternative",
    title: "YNAB Budget Tool",
    provider: "YNAB",
    category: "cashflow",
    description: "Give every dollar a job. The most effective budgeting method for young adults.",
    whyItMatters: "People who budget consistently save 2x more than those who don't.",
    ctaLabel: "Try Free",
    ctaUrl: "https://www.ynab.com",
    featured: false,
    matchConditions: {},
  },
  {
    id: "hub_koho_spending",
    title: "KOHO Spending & Saving",
    provider: "KOHO",
    category: "cashflow",
    description: "Prepaid card with instant cashback, automatic savings roundups, and spending insights.",
    whyItMatters: "Automated savings remove willpower from the equation — you save without thinking about it.",
    ctaLabel: "Get KOHO",
    ctaUrl: "https://www.koho.ca",
    featured: false,
    matchConditions: {},
  },

  // ── Cashflow & Career ──
  {
    id: "hub_job_bank",
    title: "Job Bank Canada",
    provider: "Government of Canada",
    category: "cashflow",
    description: "Search jobs, explore careers, and find salary data across Canada — all free.",
    whyItMatters: "Understanding the job market helps you negotiate better and find opportunities.",
    ctaLabel: "Search Jobs",
    ctaUrl: "https://www.jobbank.gc.ca",
    featured: false,
    matchConditions: { employed: false },
  },
  {
    id: "hub_linkedin_learning",
    title: "Free Skills Training",
    provider: "LinkedIn Learning",
    category: "cashflow",
    description: "Free courses through many public libraries. Build skills in tech, business, and design.",
    whyItMatters: "Upskilling directly increases your earning potential — and it's often free through libraries.",
    ctaLabel: "Browse Courses",
    ctaUrl: "https://www.linkedin.com/learning/",
    featured: false,
    matchConditions: {},
  },
  {
    id: "hub_gig_taxes",
    title: "Gig Worker Tax Guide",
    provider: "YUTH",
    category: "tax",
    description: "Understand your tax obligations as a freelancer, Uber driver, or gig worker in Canada.",
    whyItMatters: "Side income has tax implications — not tracking it can lead to a surprise bill.",
    ctaLabel: "Ask AI",
    ctaUrl: "/ask-ai",
    featured: false,
    matchConditions: { employed: true },
  },
];

/* ── Matching / scoring ── */

import type { UserProfile } from "@/types/profile";

/**
 * Score an item against a user profile. Higher = more relevant.
 * Returns 0 if no conditions match, positive score for matches.
 */
export function scoreHubItem(item: HubItem, profile: UserProfile | null): number {
  if (!profile) return item.featured ? 1 : 0;

  const conditions = item.matchConditions;
  let score = 0;
  let totalConditions = 0;
  let matchedConditions = 0;

  // Check flag-based conditions
  for (const [key, expected] of Object.entries(conditions)) {
    if (key === "ageMin" || key === "ageMax" || key === "provinceIn") continue;
    totalConditions++;
    const actual = profile[key as keyof UserProfile];
    if (actual === expected) {
      matchedConditions++;
      score += 10;
    }
  }

  // Age range
  if (conditions.ageMin !== undefined || conditions.ageMax !== undefined) {
    totalConditions++;
    const age = typeof profile.age === "number" ? profile.age : parseInt(String(profile.age ?? "0"), 10);
    const min = conditions.ageMin ?? 0;
    const max = conditions.ageMax ?? 999;
    if (age >= min && age <= max) {
      matchedConditions++;
      score += 10;
    }
  }

  // Province
  if (conditions.provinceIn && conditions.provinceIn.length > 0) {
    totalConditions++;
    if (profile.province && conditions.provinceIn.includes(profile.province)) {
      matchedConditions++;
      score += 10;
    }
  }

  // Bonus for featured
  if (item.featured) score += 5;

  // Bonus if ALL conditions matched (perfect fit)
  if (totalConditions > 0 && matchedConditions === totalConditions) {
    score += 15;
  }

  return score;
}

/**
 * Sort hub items by relevance to the user.
 * Items with matching conditions sort first, then featured, then alphabetical.
 */
export function getPersonalizedHubItems(
  items: HubItem[],
  profile: UserProfile | null
): HubItem[] {
  return [...items].sort((a, b) => {
    const scoreA = scoreHubItem(a, profile);
    const scoreB = scoreHubItem(b, profile);
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Within same score, featured first
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}
