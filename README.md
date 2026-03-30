# LifeStack MVP

LifeStack is a student operating system focused on one core action loop:

**Discover opportunity -> Save -> Track -> Apply**

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- JWT auth (HTTP-only cookie)
- Firestore-backed user persistence (with local JSON fallback for development)
- LocalStorage for tasks and saved-opportunity tracking
- Optional Featherless API integration for personalized fit text

## Features Implemented

- Email/password sign up + login
- User profile capture:
  - name
  - grade (9, 10, 11, 12, college)
  - interests
  - goals
- Dashboard sections:
  - Today (task list with add/complete/remove)
  - Opportunities For You (top matched opportunities)
  - Saved Opportunities (status tracking: saved/applying/applied)
- Opportunity engine:
  - 40-item dataset across internships, hackathons, scholarships, competitions
  - Matching algorithm (+2/tag match, +1 if deadline is soon)
  - Sorting by score, then deadline
- Quick Apply links via external `Open Link`
- Bonus labels:
  - Apply Soon
  - High Match
- Featherless-powered recommendation text with deterministic fallback

## Run Locally

```bash
npm install
npm run dev
```

App routes:

- `/login`
- `/dashboard`

## Environment Variables

Copy `.env.example` to `.env.local` and set values as needed:

- `JWT_SECRET`
- `FEATHERLESS_API_KEY` (optional)
- `FEATHERLESS_BASE_URL` (optional)
- `FEATHERLESS_MODEL` (optional)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

If Featherless keys are not provided, the app uses a built-in fallback recommendation generator.

For Vercel + Firestore:

- Create a Firebase service account key.
- Copy `project_id`, `client_email`, and `private_key` into the env vars above.
- In Vercel, paste `FIREBASE_PRIVATE_KEY` exactly from JSON (including line breaks escaped as `\n`).

## Key Files

- `app/login/page.jsx`
- `app/dashboard/page.jsx`
- `components/Navbar.jsx`
- `components/TaskList.jsx`
- `components/OpportunityCard.jsx`
- `lib/data.js`
- `lib/matchingAlgorithm.js`
- `app/api/auth/register/route.js`
- `app/api/auth/login/route.js`
- `app/api/auth/me/route.js`
- `app/api/auth/logout/route.js`
- `app/api/recommendation/route.js`
