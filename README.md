# YUTH.

YUTH is an AI-powered assistant that helps the next generation of young Canadian adults discover government benefits, financial opportunities, and important next steps based on their life situation. By combining structured program data with personalized profiles and AI guidance, YUTH helps users understand what money they may be missing and what financial actions they should take — from filing taxes and building credit to choosing between accounts like a TFSA or FHSA.

## Features
add all features
## Architecture
add project architecture
## Tech Stack
| Layer | Technology |
|----------|-------------|
| Frontend | Next.js |
| Styling | TailwindCSS |
| Backend | Next.js API Routes |
| AI | OpenAI API |
| Database | Supabase |
| Data Layer | Structured JSON |
| Browser Extension | Chrome Extension (Manifest v3) |
| UI Integration | Chrome Side Panel API |

## Smart Spend Chrome Extension

The YUTH. Chrome Extension provides **real-time financial context while users shop online**.  
When a supported product page is opened, the extension analyzes the purchase against the user's financial profile and displays a quick recommendation in the browser side panel.

This enables users to understand how a purchase fits into their financial plan **before completing the transaction**.

### Overview

YUTH's Smart Spender brings financial intelligence directly into your browser. As you browse the web, it understands the financial context of the page. From purchases and subscriptions to travel and everyday spending, it provides instant insights to help you make smarter decisions before money leaves your account.

The result is presented in a **lightweight side panel dashboard** that summarizes whether the purchase fits the user’s financial plan.

### How It Works

1. A content script detects supported product pages.
2. Product metadata is extracted from the page.
3. The extension sends the data to the MapleMind analysis API.
4. The backend evaluates the purchase against the user's financial profile.
5. The result is stored locally and rendered in the side panel.

### Extension Structure

```text
extension/
├── manifest.json
├── background.js
├── content-script.js
├── extractors/
│   ├── amazon.js
│   └── index.js
├── sidepanel.html
├── sidepanel.js
└── sidepane.css
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Future Work

MapleMind is designed to expand into a broader platform for financial adulthood support in Canada.

Potential future features include:

- tax filing guidance
- credit score monitoring
- housing and insurance comparisons
- savings and investment planning
- financial milestone tracking
- partner integrations and affiliate services

## License

MIT License
