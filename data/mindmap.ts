import type { UserProfile, UserProfileFlagKey } from "@/types/profile";
import type { ActionCompletionMap } from "@/lib/persistence/action-store";
import type { ActionItem } from "@/types/action";
import type { Benefit } from "@/types/benefit";

/* ── Node status ── */

export type MindMapNodeStatus = "relevant_now" | "in_progress" | "completed" | "explore_later";

export const NODE_STATUS_LABELS: Record<MindMapNodeStatus, string> = {
  relevant_now: "Relevant Now",
  in_progress: "In Progress",
  completed: "Completed",
  explore_later: "Explore Later",
};

export const NODE_STATUS_COLORS: Record<MindMapNodeStatus, { bg: string; text: string; ring: string }> = {
  relevant_now: { bg: "#fff1f2", text: "#c82233", ring: "#c82233" },
  in_progress: { bg: "#fef8ec", text: "#92620a", ring: "#d4a017" },
  completed: { bg: "#eef6ef", text: "#2f7a47", ring: "#2f7a47" },
  explore_later: { bg: "#f3f1ef", text: "#8a8580", ring: "#c4bdb5" },
};

/* ── Node definition ── */

export interface MindMapNode {
  id: string;
  label: string;
  icon: string;
  description: string;
  whyItMatters: string;
  parentId: string | null;
  domain: string;
  relatedActionIds: string[];
  relatedBenefitIds: string[];
  profileRelevanceKeys: UserProfileFlagKey[];
  askAiPrompt: string;
  nextStep?: string;
}

/* ── Root domains ── */

const ROOT_ID = "you";

export const ROOT_NODE: MindMapNode = {
  id: ROOT_ID,
  label: "You",
  icon: "🍁",
  description: "Your adult-life map. Explore domains to understand what matters and what to do next.",
  whyItMatters: "Everything connects back to your unique situation.",
  parentId: null,
  domain: "root",
  relatedActionIds: [],
  relatedBenefitIds: [],
  profileRelevanceKeys: [],
  askAiPrompt: "Give me a quick overview of my biggest financial priorities as a young adult in Canada.",
};

export const DOMAIN_NODES: MindMapNode[] = [
  {
    id: "money",
    label: "Money",
    icon: "💰",
    description: "Track income, budgeting, and day-to-day cash flow to stay in control of spending.",
    whyItMatters: "Understanding money flow prevents stress and unlocks other goals like saving and investing.",
    parentId: ROOT_ID,
    domain: "money",
    relatedActionIds: [],
    relatedBenefitIds: ["canada_workers_benefit"],
    profileRelevanceKeys: ["employed"],
    askAiPrompt: "How should I manage my money as a young adult in Canada?",
  },
  {
    id: "taxes",
    label: "Taxes",
    icon: "📋",
    description: "Filing, credits, deductions, and understanding your CRA obligations each year.",
    whyItMatters: "Taxes are your biggest unlock. filing activates credits, benefits, and payments you qualify for.",
    parentId: ROOT_ID,
    domain: "taxes",
    relatedActionIds: ["file_taxes", "register_cra_my_account"],
    relatedBenefitIds: ["gst_hst_credit"],
    profileRelevanceKeys: ["filesTaxes"],
    askAiPrompt: "What do I need to know about filing taxes in Canada as a young adult?",
  },
  {
    id: "housing",
    label: "Housing",
    icon: "🏠",
    description: "Rent, housing costs, tenant rights, and getting ready for your first home.",
    whyItMatters: "Housing is usually your biggest expense. Knowing your rights and supports saves real money.",
    parentId: ROOT_ID,
    domain: "housing",
    relatedActionIds: ["review_rent_support_programs"],
    relatedBenefitIds: ["fhsa"],
    profileRelevanceKeys: ["renter"],
    askAiPrompt: "What housing support and first-home options are available to me in Canada?",
  },
  {
    id: "school",
    label: "School",
    icon: "🎓",
    description: "Student aid, tuition credits, grants, and making the most of post-secondary.",
    whyItMatters: "Student status opens up grants, credits, and loan forgiveness you might not know about.",
    parentId: ROOT_ID,
    domain: "school",
    relatedActionIds: ["apply_provincial_student_aid", "claim_tuition_tax_credits"],
    relatedBenefitIds: ["canada_student_grant", "provincial_student_aid"],
    profileRelevanceKeys: ["student", "isPostSecondary"],
    askAiPrompt: "What financial support is available for students in Canada?",
  },
  {
    id: "work",
    label: "Work",
    icon: "💼",
    description: "Employment income, workplace benefits, payroll deductions, and career moves.",
    whyItMatters: "Optimizing work benefits and understanding deductions can significantly increase your net income.",
    parentId: ROOT_ID,
    domain: "work",
    relatedActionIds: ["optimize_work_benefits"],
    relatedBenefitIds: ["canada_workers_benefit"],
    profileRelevanceKeys: ["employed", "noEmployerBenefits"],
    askAiPrompt: "How do I optimize my workplace benefits and payroll deductions in Canada?",
  },
  {
    id: "benefits",
    label: "Benefits",
    icon: "🛡️",
    description: "Government credits, grants, and programs you may qualify for based on your profile.",
    whyItMatters: "Many young adults leave thousands on the table by not claiming what they qualify for.",
    parentId: ROOT_ID,
    domain: "benefits",
    relatedActionIds: ["file_taxes"],
    relatedBenefitIds: ["gst_hst_credit", "canada_workers_benefit", "canada_student_grant"],
    profileRelevanceKeys: ["filesTaxes"],
    askAiPrompt: "What government benefits and credits am I eligible for as a young Canadian adult?",
  },
  {
    id: "savings",
    label: "Savings",
    icon: "🏦",
    description: "Emergency funds, TFSAs, FHSAs, and building a safety net for the future.",
    whyItMatters: "Even small regular savings create stability and unlock tax-advantaged growth over time.",
    parentId: ROOT_ID,
    domain: "savings",
    relatedActionIds: ["build_emergency_fund"],
    relatedBenefitIds: ["fhsa", "tfsa"],
    profileRelevanceKeys: ["hasEmergencySavings"],
    askAiPrompt: "What are the best savings strategies and accounts for a young adult in Canada?",
  },
  {
    id: "debt",
    label: "Debt",
    icon: "📉",
    description: "Student loans, credit cards, lines of credit, and strategies to pay it down.",
    whyItMatters: "Managing debt early protects your credit score and frees up cash for bigger life goals.",
    parentId: ROOT_ID,
    domain: "debt",
    relatedActionIds: ["start_debt_repayment_plan", "check_credit_score"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["hasDebt"],
    askAiPrompt: "What is the best approach to managing and paying off debt in Canada?",
  },
  {
    id: "health",
    label: "Health Coverage",
    icon: "🩺",
    description: "Provincial health insurance, supplemental plans, dental, prescriptions, and mental health.",
    whyItMatters: "Gaps in coverage can lead to unexpected costs. Knowing what's covered protects your budget.",
    parentId: ROOT_ID,
    domain: "health",
    relatedActionIds: ["optimize_work_benefits"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["noEmployerBenefits"],
    askAiPrompt: "What health coverage options should I know about as a young adult in Canada?",
  },
  {
    id: "life_moves",
    label: "Big Life Moves",
    icon: "🚀",
    description: "Moving out, buying a car, starting a family, switching careers, or immigrating.",
    whyItMatters: "Big transitions come with financial decisions. Planning ahead makes them affordable.",
    parentId: ROOT_ID,
    domain: "life_moves",
    relatedActionIds: [],
    relatedBenefitIds: ["fhsa"],
    profileRelevanceKeys: ["livesWithParents", "hasCar", "hasDependent", "isNewcomer"],
    askAiPrompt: "How should I financially prepare for big life changes as a young adult in Canada?",
  },
];

/* ── Child nodes ── */

export const CHILD_NODES: MindMapNode[] = [
  // Money children
  {
    id: "money_budgeting",
    label: "Budgeting",
    icon: "📊",
    description: "Track what comes in and what goes out each month with a budget system that works for you.",
    whyItMatters: "A clear budget prevents overspending and shows you exactly where your money goes.",
    parentId: "money",
    domain: "money",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "What's the best budgeting method for a young adult in Canada?",
    nextStep: "Set up a simple budget tracker or app this week.",
  },
  {
    id: "money_income",
    label: "Income Sources",
    icon: "💵",
    description: "Understand your paycheques, side income, and how deductions affect take-home pay.",
    whyItMatters: "Knowing your net income accurately is the foundation for every other financial plan.",
    parentId: "money",
    domain: "money",
    relatedActionIds: ["optimize_work_benefits"],
    relatedBenefitIds: ["canada_workers_benefit"],
    profileRelevanceKeys: ["employed"],
    askAiPrompt: "How do payroll deductions work in Canada and what affects my take-home pay?",
  },
  {
    id: "money_banking",
    label: "Banking",
    icon: "🏧",
    description: "Choosing the right bank account, reducing fees, and managing everyday transactions.",
    whyItMatters: "The wrong bank account quietly drains money through fees you don't need to pay.",
    parentId: "money",
    domain: "money",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "What should I look for in a bank account as a young adult in Canada?",
  },

  // Taxes children
  {
    id: "taxes_filing",
    label: "Filing Your Return",
    icon: "📝",
    description: "How and when to file your annual tax return with the CRA.",
    whyItMatters: "Filing on time activates credits, avoids penalties, and keeps benefit payments flowing.",
    parentId: "taxes",
    domain: "taxes",
    relatedActionIds: ["file_taxes", "register_cra_my_account"],
    relatedBenefitIds: ["gst_hst_credit"],
    profileRelevanceKeys: ["filesTaxes"],
    askAiPrompt: "Walk me through how to file my taxes in Canada step by step.",
    nextStep: "Register for CRA My Account and file your return.",
  },
  {
    id: "taxes_credits",
    label: "Tax Credits",
    icon: "🏷️",
    description: "Non-refundable and refundable credits that reduce how much you owe.",
    whyItMatters: "Credits are free money you've already earned. not claiming them is leaving cash behind.",
    parentId: "taxes",
    domain: "taxes",
    relatedActionIds: ["file_taxes", "claim_tuition_tax_credits"],
    relatedBenefitIds: ["gst_hst_credit", "canada_workers_benefit"],
    profileRelevanceKeys: ["filesTaxes"],
    askAiPrompt: "What tax credits am I likely eligible for as a young Canadian?",
  },
  {
    id: "taxes_deductions",
    label: "Deductions",
    icon: "✂️",
    description: "Expenses that reduce your taxable income like moving costs, union dues, or RRSP contributions.",
    whyItMatters: "Deductions lower your tax bill and can push you into a lower bracket.",
    parentId: "taxes",
    domain: "taxes",
    relatedActionIds: ["file_taxes"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["employed"],
    askAiPrompt: "What deductions can I claim on my Canadian tax return?",
  },

  // Housing children
  {
    id: "housing_renting",
    label: "Renting",
    icon: "🔑",
    description: "Tenant rights, lease agreements, rent receipts, and provincial renter credits.",
    whyItMatters: "Knowing your rights as a tenant protects you and may unlock renter-specific tax credits.",
    parentId: "housing",
    domain: "housing",
    relatedActionIds: ["review_rent_support_programs", "claim_renter_credits"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["renter"],
    askAiPrompt: "What are my rights as a renter in my province and what credits can I claim?",
    nextStep: "Keep all rent receipts and review your provincial renter credits.",
  },
  {
    id: "housing_first_home",
    label: "First Home",
    icon: "🏡",
    description: "FHSA, Home Buyers' Plan, and getting mortgage-ready as a first-time buyer.",
    whyItMatters: "Starting to save early in tax-advantaged accounts accelerates your timeline to ownership.",
    parentId: "housing",
    domain: "housing",
    relatedActionIds: [],
    relatedBenefitIds: ["fhsa"],
    profileRelevanceKeys: ["renter", "livesWithParents"],
    askAiPrompt: "What first-time home buyer programs exist in Canada and how do I prepare?",
  },
  {
    id: "housing_costs",
    label: "Housing Costs",
    icon: "📍",
    description: "Utilities, insurance, maintenance, and the true cost of keeping a roof over your head.",
    whyItMatters: "Rent or mortgage is just part of the picture. total housing cost drives your budget.",
    parentId: "housing",
    domain: "housing",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["renter"],
    askAiPrompt: "How much should I budget for total housing costs in Canada?",
  },

  // School children
  {
    id: "school_student_aid",
    label: "Student Aid",
    icon: "📚",
    description: "Federal and provincial loans, grants, and bursaries for post-secondary students.",
    whyItMatters: "Non-repayable grants and subsidized loans can significantly reduce your education cost.",
    parentId: "school",
    domain: "school",
    relatedActionIds: ["apply_provincial_student_aid"],
    relatedBenefitIds: ["canada_student_grant", "provincial_student_aid"],
    profileRelevanceKeys: ["student"],
    askAiPrompt: "How do I apply for student financial aid in Canada?",
    nextStep: "Apply for federal and provincial student aid before the deadline.",
  },
  {
    id: "school_tuition_credits",
    label: "Tuition Credits",
    icon: "🧾",
    description: "Claim tuition, education, and textbook amounts using T2202 forms from your school.",
    whyItMatters: "Unclaimed tuition credits mean you're losing money you already spent.",
    parentId: "school",
    domain: "school",
    relatedActionIds: ["claim_tuition_tax_credits"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["student", "isPostSecondary"],
    askAiPrompt: "How do I claim tuition tax credits in Canada?",
  },
  {
    id: "school_loan_repayment",
    label: "Loan Repayment",
    icon: "💳",
    description: "Repayment assistance, grace periods, and interest deductions for student loans.",
    whyItMatters: "Knowing your repayment options prevents default and can reduce total interest paid.",
    parentId: "school",
    domain: "school",
    relatedActionIds: ["start_debt_repayment_plan"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["student", "hasDebt"],
    askAiPrompt: "What are my student loan repayment options in Canada?",
  },

  // Work children
  {
    id: "work_benefits",
    label: "Workplace Benefits",
    icon: "🎁",
    description: "Health plans, pension matching, dental, vision, and other employer-provided supports.",
    whyItMatters: "Free employer benefits are part of your compensation. not using them is losing money.",
    parentId: "work",
    domain: "work",
    relatedActionIds: ["optimize_work_benefits"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["employed", "noEmployerBenefits"],
    askAiPrompt: "How do I make the most of my workplace benefits in Canada?",
    nextStep: "Review your employer benefits package and opt in where eligible.",
  },
  {
    id: "work_payroll",
    label: "Payroll & Deductions",
    icon: "📄",
    description: "CPP, EI, income tax withholding, and understanding your pay stub.",
    whyItMatters: "Understanding deductions ensures you're not over-withheld and helps you plan accurately.",
    parentId: "work",
    domain: "work",
    relatedActionIds: [],
    relatedBenefitIds: ["canada_workers_benefit"],
    profileRelevanceKeys: ["employed"],
    askAiPrompt: "What are CPP, EI, and income tax deductions on my Canadian paycheque?",
  },
  {
    id: "work_side_income",
    label: "Side Income",
    icon: "🔧",
    description: "Freelancing, gig work, and self-employment tax obligations.",
    whyItMatters: "Side income has tax implications you need to track or you'll owe at filing time.",
    parentId: "work",
    domain: "work",
    relatedActionIds: ["file_taxes"],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "How does side income affect my taxes in Canada?",
  },

  // Benefits children
  {
    id: "benefits_gst",
    label: "GST/HST Credit",
    icon: "🧮",
    description: "Quarterly tax-free payment to help offset GST/HST costs if your income is modest.",
    whyItMatters: "It's automatic once you file. but you must file to receive it.",
    parentId: "benefits",
    domain: "benefits",
    relatedActionIds: ["file_taxes"],
    relatedBenefitIds: ["gst_hst_credit"],
    profileRelevanceKeys: ["filesTaxes"],
    askAiPrompt: "How does the GST/HST credit work and how do I qualify?",
  },
  {
    id: "benefits_cwb",
    label: "Canada Workers Benefit",
    icon: "🏅",
    description: "Refundable credit for working individuals and families with modest income.",
    whyItMatters: "It's one of the most valuable credits for working young adults in Canada.",
    parentId: "benefits",
    domain: "benefits",
    relatedActionIds: ["file_taxes"],
    relatedBenefitIds: ["canada_workers_benefit"],
    profileRelevanceKeys: ["employed"],
    askAiPrompt: "Do I qualify for the Canada Workers Benefit and how much could I receive?",
  },
  {
    id: "benefits_provincial",
    label: "Provincial Programs",
    icon: "🗺️",
    description: "Province-specific credits, rebates, and support programs you may be eligible for.",
    whyItMatters: "Provincial benefits vary widely. checking your province's programs can unlock real value.",
    parentId: "benefits",
    domain: "benefits",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "What provincial benefits and credits are available in my province?",
  },

  // Savings children
  {
    id: "savings_emergency",
    label: "Emergency Fund",
    icon: "🆘",
    description: "Build a buffer of 3+ months expenses for unexpected costs.",
    whyItMatters: "An emergency fund is the most important financial safety net you can build.",
    parentId: "savings",
    domain: "savings",
    relatedActionIds: ["build_emergency_fund"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["hasEmergencySavings"],
    askAiPrompt: "How do I build an emergency fund on a tight budget in Canada?",
    nextStep: "Set up automatic weekly transfers to a high-interest savings account.",
  },
  {
    id: "savings_tfsa",
    label: "TFSA",
    icon: "📈",
    description: "Tax-Free Savings Account for investing and saving with tax-free growth.",
    whyItMatters: "TFSA withdrawals are completely tax-free, making it ideal for flexible saving goals.",
    parentId: "savings",
    domain: "savings",
    relatedActionIds: [],
    relatedBenefitIds: ["tfsa"],
    profileRelevanceKeys: [],
    askAiPrompt: "How does a TFSA work and how should I use mine?",
  },
  {
    id: "savings_fhsa",
    label: "FHSA",
    icon: "🏘️",
    description: "First Home Savings Account. tax-deductible contributions for your first home.",
    whyItMatters: "FHSA combines RRSP-like deductions with TFSA-like tax-free withdrawals for home buying.",
    parentId: "savings",
    domain: "savings",
    relatedActionIds: [],
    relatedBenefitIds: ["fhsa"],
    profileRelevanceKeys: ["renter", "livesWithParents"],
    askAiPrompt: "Should I open an FHSA and how does it compare to the Home Buyers' Plan?",
  },

  // Debt children
  {
    id: "debt_credit_score",
    label: "Credit Score",
    icon: "📊",
    description: "What your credit score means, how to check it, and how to improve it.",
    whyItMatters: "A good credit score unlocks better rates on loans, credit cards, and even housing.",
    parentId: "debt",
    domain: "debt",
    relatedActionIds: ["check_credit_score"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["hasDebt"],
    askAiPrompt: "How do I check and improve my credit score in Canada?",
    nextStep: "Check your credit report for free through Equifax or TransUnion.",
  },
  {
    id: "debt_repayment",
    label: "Repayment Strategy",
    icon: "📉",
    description: "Avalanche vs snowball methods, consolidation, and automating payments.",
    whyItMatters: "A clear strategy eliminates debt faster and reduces total interest paid.",
    parentId: "debt",
    domain: "debt",
    relatedActionIds: ["start_debt_repayment_plan"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["hasDebt"],
    askAiPrompt: "What is the best debt repayment strategy for my situation?",
  },
  {
    id: "debt_credit_cards",
    label: "Credit Cards",
    icon: "💳",
    description: "Using credit wisely, avoiding interest traps, and picking the right card.",
    whyItMatters: "Credit cards build credit history but high-interest debt spirals fast if not managed.",
    parentId: "debt",
    domain: "debt",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "How should I use credit cards responsibly as a young adult?",
  },

  // Health children
  {
    id: "health_provincial",
    label: "Provincial Health",
    icon: "🏥",
    description: "What your provincial health plan covers and how to register.",
    whyItMatters: "Provincial coverage is your baseline. knowing what's included prevents surprise bills.",
    parentId: "health",
    domain: "health",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "What does my provincial health insurance cover in Canada?",
  },
  {
    id: "health_dental",
    label: "Dental & Vision",
    icon: "🦷",
    description: "Coverage options for dental, vision, and prescription medications.",
    whyItMatters: "These are often not covered by provincial plans. supplemental coverage saves money.",
    parentId: "health",
    domain: "health",
    relatedActionIds: ["optimize_work_benefits"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["noEmployerBenefits"],
    askAiPrompt: "How do I get dental and vision coverage in Canada without employer benefits?",
  },
  {
    id: "health_mental",
    label: "Mental Health",
    icon: "🧠",
    description: "Accessing counseling, therapy, and mental health support resources.",
    whyItMatters: "Mental health affects every part of adulting. support is available and often subsidized.",
    parentId: "health",
    domain: "health",
    relatedActionIds: [],
    relatedBenefitIds: [],
    profileRelevanceKeys: [],
    askAiPrompt: "What mental health support options are available and affordable in Canada?",
  },

  // Big Life Moves children
  {
    id: "life_moving_out",
    label: "Moving Out",
    icon: "📦",
    description: "Planning the financial side of leaving your parents' home for the first time.",
    whyItMatters: "Moving out is a major expense shift. budgeting it properly prevents early failures.",
    parentId: "life_moves",
    domain: "life_moves",
    relatedActionIds: ["build_emergency_fund"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["livesWithParents"],
    askAiPrompt: "How much should I save before moving out on my own in Canada?",
    nextStep: "Calculate your move-out budget including first/last rent, deposits, and essentials.",
  },
  {
    id: "life_car",
    label: "Buying a Car",
    icon: "🚗",
    description: "Insurance, financing, depreciation, and whether buying or leasing makes sense.",
    whyItMatters: "A car is often the second-biggest purchase. getting it wrong hurts your cash flow.",
    parentId: "life_moves",
    domain: "life_moves",
    relatedActionIds: ["check_credit_score"],
    relatedBenefitIds: [],
    profileRelevanceKeys: ["hasCar"],
    askAiPrompt: "Should I buy or lease a car and what are the real costs in Canada?",
  },
  {
    id: "life_newcomer",
    label: "Newcomer Setup",
    icon: "✈️",
    description: "SIN, banking, credit history, health coverage, and settling-in steps for newcomers.",
    whyItMatters: "Newcomers face unique financial setup needs. getting these right early builds a strong foundation.",
    parentId: "life_moves",
    domain: "life_moves",
    relatedActionIds: ["file_taxes", "register_cra_my_account"],
    relatedBenefitIds: ["gst_hst_credit"],
    profileRelevanceKeys: ["isNewcomer"],
    askAiPrompt: "What financial setup steps should I take as a newcomer to Canada?",
  },
];

/* ── All nodes flat ── */

export const ALL_NODES: MindMapNode[] = [ROOT_NODE, ...DOMAIN_NODES, ...CHILD_NODES];

export function getNodeById(id: string): MindMapNode | undefined {
  return ALL_NODES.find((n) => n.id === id);
}

export function getChildNodes(parentId: string): MindMapNode[] {
  return ALL_NODES.filter((n) => n.parentId === parentId);
}

/* ── Status computation ── */

export function computeNodeStatus(
  node: MindMapNode,
  profile: UserProfile | null,
  actionCompletion: ActionCompletionMap,
  matchedActions: ActionItem[],
  matchedBenefits: Benefit[]
): MindMapNodeStatus {
  if (!profile) {
    return "explore_later";
  }

  // Check if all related actions are completed
  const relatedMatchedActions = node.relatedActionIds
    .map((id) => matchedActions.find((a) => a.id === id))
    .filter(Boolean);

  const allActionsCompleted =
    relatedMatchedActions.length > 0 && relatedMatchedActions.every((a) => a && actionCompletion[a.id]);

  if (allActionsCompleted) {
    return "completed";
  }

  // Check if some actions are in progress
  const someActionsCompleted =
    relatedMatchedActions.length > 0 && relatedMatchedActions.some((a) => a && actionCompletion[a.id]);

  if (someActionsCompleted) {
    return "in_progress";
  }

  // Check profile relevance
  const isRelevant = node.profileRelevanceKeys.some((key) => {
    const val = profile[key];
    // For flags like filesTaxes=false meaning "hasn't filed yet" → relevant
    if (key === "filesTaxes") return !val;
    if (key === "hasEmergencySavings") return !val;
    return val === true;
  });

  if (isRelevant) {
    return "relevant_now";
  }

  // Check if there are matched benefits
  const hasMatchedBenefits = node.relatedBenefitIds.some((id) => matchedBenefits.some((b) => b.id === id));

  if (hasMatchedBenefits) {
    return "relevant_now";
  }

  return "explore_later";
}
