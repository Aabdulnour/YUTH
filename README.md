# YUTH.
Young adults in Canada often find it difficult to understand the financial systems that affect their lives. There are so many different sources of information on tax credits, benefits, government programs, and other financial obligations that are provided by the government. This information is available online but is scattered and hard to find unless you already know where to look. YUTH is a tool that can help solve this problem by using the information provided in a user’s profile to provide access to government programs and other information in an easily digestible way. 

Rather than having to search through different government websites or try to find general information on how to manage your finances, users can find a personalized summary that highlights different opportunities they may be eligible for. 

This is an effort to close the information gap that keeps so many young adults from accessing the financial help they already deserve.

## Problem

Financial support systems in Canada are fragmented by design.

Federal and provincial programs operate independently, each with their
own eligibility requirements, application processes, and timelines.
While these programs are intended to support citizens, the lack of a
unified discovery layer creates several challenges:

-   Individuals often do not know which programs exist
-   Eligibility criteria are difficult to interpret
-   Deadlines and application processes are easy to miss
-   Financial advice available online is typically generic rather than
    personalized

For young adults navigating taxes, benefits, employment changes,
education costs, or relocation for the first time, this complexity
creates a significant barrier.

## Solution

YUTH provides a profile-driven platform that translates complex
government programs into personalized financial guidance.

Users complete a short onboarding process that captures key contextual
signals such as:

-   age
-   province
-   life situation
-   financial context

These signals are used to match the user with relevant government
programs and financial opportunities.

The platform then surfaces:

-   programs the user may qualify for
-   financial actions they should prioritize
-   official government resources needed to apply or learn more

YUTH acts as a discovery and decision-support layer on top of existing
government systems, making it easier for individuals to understand and
access support available to them.


## Key Features

**Personalized Program Discovery**: Matches users with relevant federal and provincial programs using
profile signals such as age, province, and life situation.

**Financial Action Prioritization**: Highlights the most important financial actions users should consider,
such as filing credits, applying for benefits, or reviewing eligibility.

**Unified Financial Dashboard**: Consolidates fragmented information from multiple government sources
into a single interface.

**Profile-Based Guidance**: Recommendations adapt to the user's profile rather than providing
generic financial advice.

**Chrome Extension:** YUTH's Chrome Extension provides **real-time financial context** directly into the browsing experience. This enables users to understand how a financial decision fits into their plan.
```text
Extension Structure:

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
## System Architecture
```text
    User
    │
    ├── Web Application (Next.js)
    │       ├── Onboarding
    │       ├── Profile System
    │       ├── Dashboard
    │       └── Program Discovery Engine
    │
    ├── Backend APIs
    │       ├── Profile persistence
    │       ├── Program matching engine
    │       └── AI assistance layer
    │
    ├── Database
    │       └── Supabase
    │
    └── Browser Extension
            ├── Content script
            ├── Purchase metadata extraction
            └── Side panel financial insights
```
## Tech Stack

  |Layer             |  Technology|
  ------------------- |----------------------------------
  |Frontend          |  Next.js, TypeScript, TailwindCSS|
  |Backend            | Next.js API Routes, OpenAI API|
  |Authentication % Database      |Supabase, Auth0|
  |Browser Extension   |Chrome Extension (Manifest v3)|
  |UI Integration      |Chrome Side Panel API|


## Technical Approach

The platform centers around a profile-driven recommendation system.

1.  A user completes onboarding with contextual signals.
2.  These signals map to eligibility filters.
3.  The system evaluates structured program data against those filters.
4.  Relevant programs and actions are surfaced in the dashboard.

This model allows the platform to scale as new programs and eligibility
conditions are added.

## Challenges

#### Structuring Government Program Data

Government program information is typically written for policy
interpretation rather than software systems. Converting eligibility
rules into structured logic required building a flexible schema capable
of supporting multiple jurisdictions.

#### Designing Effective Onboarding

Capturing enough information to generate meaningful recommendations
without overwhelming users required careful design of the onboarding
flow.

#### Integrating Financial Context Into Browsing

Embedding financial insights directly into a browser environment
required building a lightweight extension capable of extracting product
information and delivering contextual feedback without interrupting the
browsing experience.

## Future Development

Potential improvements include:

-   automated updates for government program changes
-   deeper eligibility modeling
-   financial milestone tracking
-   expanded browser financial analysis
-   AI-assisted financial planning
-   integrations with public and private financial services

## Getting Started

Install dependencies:

    npm install

Run the development server:

    npm run dev

Then open:

    http://localhost:3000

------------------------------------------------------------------------

## License
© 2026 YUTH. All rights reserved.
