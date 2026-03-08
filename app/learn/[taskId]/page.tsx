"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProgressProvider, useProgressContext } from "@/hooks/useProgress";

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  bg:        "#0c0a09",
  bgCard:    "#141210",
  bgCard2:   "#1a1714",
  border:    "#2e2824",
  accent:    "#c82233",
  textPrime: "#ffffff",
  textSub:   "#a09890",
  textMuted: "#6a6460",
  textFaint: "#3a3530",
};

// ─── Content ──────────────────────────────────────────────────────────────────

type Section = {
  heading: string;
  body: string;
};

type LearnContent = {
  title: string;
  subtitle: string;
  color: string;
  tldr: string;
  sections: Section[];
  keyTakeaways: string[];
};

const CONTENT: Record<string, LearnContent> = {
  "debt-2": {
    title: "Understanding Interest Rates",
    subtitle: "Why the rate on your debt matters more than the balance",
    color: "#e8394c",
    tldr: "Interest rates determine how much extra you pay on top of what you borrowed. A higher rate means your debt grows faster — understanding this lets you prioritize which debts to kill first.",
    sections: [
      {
        heading: "What is an interest rate?",
        body: "An interest rate is the cost of borrowing money, expressed as a percentage of the loan amount per year (APR — Annual Percentage Rate). If you borrow $1,000 at 20% APR, you owe $200 in interest after one year on top of the $1,000 principal.",
      },
      {
        heading: "Simple vs. compound interest",
        body: "Simple interest charges you only on the original amount. Compound interest charges you on the balance including previously accrued interest — meaning your debt grows exponentially if left unpaid. Most credit cards and loans use compound interest, compounded daily or monthly.",
      },
      {
        heading: "Why high-interest debt is an emergency",
        body: "A credit card at 22% APR doubles your balance in about 3.3 years if you make no payments. A $5,000 balance becomes $10,000 without you spending another cent. This is why high-interest debt should be treated as a financial emergency, not a background nuisance.",
      },
      {
        heading: "Fixed vs. variable rates",
        body: "A fixed rate stays the same for the life of the loan. A variable rate fluctuates with the prime rate — great when rates fall, dangerous when they rise. Mortgages, student loans, and car loans can be either. Credit cards are almost always variable.",
      },
      {
        heading: "How to use this knowledge",
        body: "List all your debts with their interest rates. Sort them highest to lowest. The avalanche method says to throw every extra dollar at the highest-rate debt first while paying minimums on the rest. This minimizes total interest paid over time.",
      },
    ],
    keyTakeaways: [
      "APR = the true annual cost of debt",
      "Compound interest makes high-rate debt grow exponentially",
      "Credit cards (18–25%) cost far more than mortgages (5–7%)",
      "Prioritize paying off highest-rate debt first (avalanche method)",
    ],
  },

  "credit-1": {
    title: "Understanding Your Credit Score",
    subtitle: "The three-digit number that affects your financial life",
    color: "#d42d3f",
    tldr: "Your credit score is a snapshot of how reliably you repay debt. A good score unlocks lower interest rates, better apartments, and even some jobs. It's built over time through simple consistent habits.",
    sections: [
      {
        heading: "What is a credit score?",
        body: "In Canada, credit scores range from 300–900 (Equifax/TransUnion). In the US, FICO scores range from 300–850. The score summarizes your credit history into a single number lenders use to assess risk. Above 720 is generally considered good; above 760 is excellent.",
      },
      {
        heading: "The five factors that build it",
        body: "Payment history (35%) — paying on time is the biggest factor. Credit utilization (30%) — how much of your available credit you're using. Length of credit history (15%) — older accounts help. Credit mix (10%) — having both revolving (cards) and installment (loans) credit. New inquiries (10%) — applying for too much credit at once lowers your score temporarily.",
      },
      {
        heading: "What hurts your score",
        body: "Missing payments — even one missed payment can drop your score 50–100 points. Maxing out credit cards — high utilization signals financial stress. Closing old accounts — reduces your average account age. Applying for multiple cards in a short period — each hard inquiry costs a few points.",
      },
      {
        heading: "How to check your score for free",
        body: "In Canada, Borrowell and Credit Karma offer free Equifax scores. You can also request a free annual credit report from Equifax and TransUnion directly. Checking your own score is a 'soft inquiry' and does not affect your score.",
      },
      {
        heading: "Building credit from scratch",
        body: "If you have no credit history, a secured credit card (where you deposit collateral) is the easiest entry point. Use it for small recurring purchases like a streaming subscription, then pay the full balance monthly. After 6–12 months of on-time payments you'll have a real score.",
      },
    ],
    keyTakeaways: [
      "Score range: 300–900 (Canada) or 300–850 (US FICO)",
      "Payment history is the most important factor (35%)",
      "Keep credit card utilization below 30% of your limit",
      "Check your score for free via Borrowell or Credit Karma",
      "Never miss a payment — set up autopay for at least the minimum",
    ],
  },

  "budget-1": {
    title: "Creating a Budget That Works",
    subtitle: "A system to tell your money where to go before it disappears",
    color: "#d42d3f",
    tldr: "A budget isn't a restriction — it's a plan. By giving every dollar a job before the month starts, you eliminate the mystery of where your money went and start making intentional choices.",
    sections: [
      {
        heading: "Why most budgets fail",
        body: "Most people budget by trying to track everything perfectly and giving up when they miss a category. The best budget is one you'll actually stick to — even if it's imprecise. Done is better than perfect.",
      },
      {
        heading: "The 50/30/20 rule",
        body: "A simple starting framework: 50% of after-tax income goes to needs (rent, groceries, utilities, transportation). 30% goes to wants (dining out, entertainment, subscriptions). 20% goes to savings and debt repayment. Adjust the percentages to fit your life — this is a guideline, not a law.",
      },
      {
        heading: "Zero-based budgeting",
        body: "Every dollar gets assigned a category until income minus expenses equals zero. This doesn't mean spending everything — it means every dollar has a job, including dollars assigned to savings. Apps like YNAB (You Need A Budget) are built around this method.",
      },
      {
        heading: "The two numbers you need to know",
        body: "Your monthly take-home income (after tax) and your total fixed monthly expenses (rent, phone, subscriptions, loan minimums). Everything left over is flexible spending. Knowing these two numbers takes less than 30 minutes and immediately clarifies your financial picture.",
      },
      {
        heading: "Making it stick",
        body: "Review your budget every month — not to judge yourself, but to adjust it. Unexpected expenses are certain; your budget should absorb them. Start with broad categories and only add detail where it helps you make decisions.",
      },
    ],
    keyTakeaways: [
      "Start simple: income − fixed expenses = flexible spending",
      "50/30/20 is a useful starting framework",
      "Review monthly — budgets need to adapt as life changes",
      "Automate savings first so you budget what's left",
      "Imperfect budgeting beats no budgeting every time",
    ],
  },

  "debt-3": {
    title: "Choosing a Debt Repayment Strategy",
    subtitle: "Two proven methods — one saves money, one saves motivation",
    color: "#bf1f30",
    tldr: "There are two main strategies: avalanche (pay highest interest first — saves the most money) and snowball (pay smallest balance first — builds momentum). Pick the one you'll actually follow.",
    sections: [
      {
        heading: "The Avalanche Method",
        body: "Pay the minimum on all debts. Put every extra dollar toward the debt with the highest interest rate. When that's paid off, roll that payment to the next highest-rate debt. This method minimizes the total interest you pay and is mathematically optimal.",
      },
      {
        heading: "The Snowball Method",
        body: "Pay the minimum on all debts. Put every extra dollar toward the smallest balance regardless of interest rate. When that's paid off, roll that payment to the next smallest balance. You get quick wins, which build motivation to keep going. Popularized by Dave Ramsey.",
      },
      {
        heading: "Which should you choose?",
        body: "Mathematically, avalanche wins. Psychologically, snowball wins for people who struggle with motivation. Research shows that people who use the snowball method are more likely to become debt-free because the early wins keep them engaged. If you're disciplined and numbers-driven, use avalanche. If you need encouragement, use snowball.",
      },
      {
        heading: "Debt consolidation",
        body: "If you have multiple high-interest debts, consolidating them into a single lower-rate loan can reduce your total interest and simplify payments. Options include balance transfer credit cards (often 0% for 12–18 months), personal loans, or a home equity line. Watch out for transfer fees and what happens when the promotional rate ends.",
      },
      {
        heading: "The minimum payment trap",
        body: "Paying only minimums on a $5,000 credit card at 22% APR can take over 30 years to pay off and cost more than $8,000 in interest. Always pay more than the minimum whenever possible — even an extra $50/month makes a dramatic difference.",
      },
    ],
    keyTakeaways: [
      "Avalanche = lowest total interest (highest rate first)",
      "Snowball = best for motivation (smallest balance first)",
      "Both work — consistency matters more than method",
      "Never just pay the minimum — it's designed to keep you in debt",
      "Consider consolidation if you can get a lower rate",
    ],
  },

  "maint-4": {
    title: "Credit Utilization: Keep It Below 30%",
    subtitle: "How much of your credit limit you use matters more than you think",
    color: "#a09080",
    tldr: "Credit utilization is the second biggest factor in your credit score. It's simply your total credit card balances divided by your total credit limits. Keeping it below 30% signals responsible use — below 10% is ideal.",
    sections: [
      {
        heading: "What is credit utilization?",
        body: "If your credit card has a $5,000 limit and you have a $1,500 balance, your utilization is 30%. If you have multiple cards, utilization is calculated both per card and in total across all cards. Most scoring models look at both.",
      },
      {
        heading: "Why it matters so much",
        body: "Utilization makes up roughly 30% of your credit score. High utilization signals to lenders that you may be overextended financially — even if you always pay on time. Someone with a $10,000 limit carrying a $9,000 balance looks risky regardless of their payment history.",
      },
      {
        heading: "The 30% rule (and why 10% is better)",
        body: "Keeping utilization below 30% is the standard advice. But people with the highest credit scores typically keep utilization below 10%. The sweet spot is between 1–9% — you want to show you're using credit, but very modestly.",
      },
      {
        heading: "How to lower your utilization",
        body: "Pay down balances before your statement closes (not just by the due date — the balance reported to credit bureaus is usually your statement balance). Request a credit limit increase — this lowers your ratio without paying anything. Spread charges across multiple cards. Don't close old cards — this reduces your total available credit and spikes your utilization.",
      },
      {
        heading: "Utilization resets monthly",
        body: "Unlike payment history, utilization has no memory — it's based on your current balances. This means you can improve your score relatively quickly just by paying down balances. A 40% utilization this month can become 5% next month after a big payment.",
      },
    ],
    keyTakeaways: [
      "Utilization = balance ÷ credit limit (as a percentage)",
      "Below 30% is good, below 10% is excellent",
      "It's the second biggest credit score factor (≈30%)",
      "Pay before your statement date, not just the due date",
      "Never close old cards — it shrinks your available credit",
    ],
  },
};

// ─── Inner page component ─────────────────────────────────────────────────────

function LearnPageInner() {
  const params  = useParams();
  const router  = useRouter();
  const taskId  = params?.taskId as string;
  const content = CONTENT[taskId];
  const { markComplete, isComplete } = useProgressContext();

  // Build a minimal task object for smartToggle
  const task = { id: taskId, label: content?.title ?? taskId };

  const handleBack = () => {
    // markComplete writes to localStorage synchronously before navigation
    if (content && !isComplete(taskId)) {
      markComplete(taskId);
    }
    router.back();
  };

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: T.bg }}>
        <div className="text-center">
          <p style={{ color: T.textMuted }} className="mb-4">No content found for this task.</p>
          <button onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: T.bgCard, border: `1px solid ${T.border}`, color: T.textSub }}>
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  const alreadyDone = isComplete(taskId);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.textPrime,
      fontFamily: "'Inter','Avenir Next','Segoe UI',sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: `${T.bg}e8`, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-[0.2em]"
            style={{ color: T.textFaint }}>YUTH / LEARN</span>
        </div>
        <button onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80"
          style={{
            background: alreadyDone ? `${content.color}22` : content.color,
            border: `1px solid ${alreadyDone ? content.color : "transparent"}`,
            color: alreadyDone ? content.color : "#ffffff",
          }}>
          {alreadyDone ? "← Already complete" : "← Mark complete & go back"}
        </button>
      </header>

      {/* Hero */}
      <div className="px-6 pt-12 pb-8 max-w-2xl mx-auto">
        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 tracking-wide"
          style={{ background: `${content.color}20`, color: content.color, border: `1px solid ${content.color}40` }}>
          RESEARCH TASK
        </div>
        <h1 className="text-3xl font-black mb-2 leading-tight" style={{ color: T.textPrime }}>
          {content.title}
        </h1>
        <p className="text-base" style={{ color: T.textSub }}>{content.subtitle}</p>
      </div>

      {/* TL;DR */}
      <div className="px-6 max-w-2xl mx-auto mb-8">
        <div className="rounded-xl p-5" style={{ background: `${content.color}12`,
          border: `1px solid ${content.color}35` }}>
          <div className="text-xs font-bold tracking-widest mb-2" style={{ color: content.color }}>
            TL;DR
          </div>
          <p className="text-sm leading-relaxed" style={{ color: T.textSub }}>
            {content.tldr}
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="px-6 max-w-2xl mx-auto space-y-6 pb-8">
        {content.sections.map((section, i) => (
          <div key={i} className="rounded-xl p-5"
            style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: T.textPrime }}>
              {section.heading}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: T.textSub }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>

      {/* Key takeaways */}
      <div className="px-6 max-w-2xl mx-auto pb-12">
        <div className="rounded-xl p-5" style={{ background: T.bgCard2,
          border: `1px solid ${T.border}` }}>
          <div className="text-xs font-bold tracking-widest mb-4" style={{ color: content.color }}>
            KEY TAKEAWAYS
          </div>
          <ul className="space-y-2">
            {content.keyTakeaways.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm"
                style={{ color: T.textSub }}>
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ background: `${content.color}25`, color: content.color }}>
                  {i + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 max-w-2xl mx-auto pb-16 flex justify-center">
        <button onClick={handleBack}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-80"
          style={{
            background: alreadyDone ? `${content.color}22` : content.color,
            border: `1px solid ${alreadyDone ? content.color : "transparent"}`,
            color: alreadyDone ? content.color : "#ffffff",
          }}>
          {alreadyDone ? "← Already marked complete" : "← Got it — mark complete & go back"}
        </button>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function LearnPage() {
  return (
      <LearnPageInner />
  
  );
}