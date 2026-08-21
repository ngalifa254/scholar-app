# Student Center - Project Rules

## Tech Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- NextAuth (Staff Authentication)
- Deployment: Vercel (scholars.wahomefoundation.com)

## Project Context
Student Center is the Wahome Foundation's scholarship platform. It consists of:
1. **Public Pages:** An "Our Scholars" showcase matching the main site branding (www.wahomefoundation.com).
2. **Staff Dashboard:** Login-protected interface to upload a Grade 9 applicant CSV, score them on four criteria, generate AI narrative reviews, and export results.

## Scoring Criteria (Four Fields - Max 100 pts)
- **Child Status** (Max 35 pts)
  - Total Orphan (35 pts)
  - Partial Orphan – Guardian Not Working (30 pts)
  - Both Parents Present, None Working (25 pts)
  - Partial Orphan – Guardian Working (20 pts)
  - Both Parents, One Working (12 pts)
  - Both Parents, Both Working (5 pts)
- **Hardships Faced** (Max 25 pts, cumulative)
  - Chronically Ill Family Member (+8 pts)
  - Severe Distance to School (>5km walking) (+6 pts)
  - Heavy Household Chores / Labor (+6 pts)
  - Lack of clean water and connection to the power grid (+5 pts)
- **Academic Merit** (Max 20 pts)
  - Excellent (20 pts)
  - Good (15 pts)
  - Average (10 pts)
  - Below Average (5 pts)
- **Character & Leadership** (Max 20 pts)
  - High – Active leader/community involvement (20 pts)
  - Moderate – Some involvement (13 pts)
  - Low – Minimal involvement (6 pts)

## Important Commands
- Run development server: `npm run dev`
- Build project: `npm run build`
- Type checking: `npx tsc --noEmit`
- Linting: `npm run lint`