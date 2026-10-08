# PrepPilot — Project State

Last updated: Auto-recompute milestone complete (post Backend Phase 5 + Frontend Milestone 1)

## Completed

### Backend (apps/api) — Phases 0–5 + small additions, fully tested (30 tests passing)
- Phase 0: Monorepo scaffold, env validation, Prisma + Postgres, health check
- Phase 1: Auth (DB-backed sessions, httpOnly cookies, signup/login/logout/me)
- Phase 2: Topic (hierarchical) + Question (MCQ) models, seed data (DSA/Arrays/Trees, SQL/Joins)
- Phase 3: Activity ingestion for MCQ — server-side scoring, unlimited re-attempts,
  each attempt = new Activity+Attempt row
- Phase 4: Analysis Engine v1 — rule-based mastery scoring (difficulty-weighted accuracy
  × recency decay), rolled up through topic hierarchy, stored in SkillProfile
- Phase 5: Dashboard aggregation — GET /api/dashboard/summary (readiness score,
  weak topics, preparation balance, 90-day activity heatmap)
- GET /api/activities/me (history list) — added for the frontend history view
- CORS middleware added (FRONTEND_URL env var) for cross-port cookie auth
- Auto-recompute: submitMcqAttempt now fires recomputeSkillProfiles(userId) as
  fire-and-forget after saving an attempt, so mastery/dashboard data updates
  without any manual trigger. POST /api/analysis/recompute still exists and
  works as a manual override.

### Frontend (apps/web) — Milestone 1 (first vertical slice)
- Vite + React + TS + Tailwind scaffold
- TanStack Query for all data fetching, React Router for navigation
- Pages: Login (login/signup toggle), Practice (MCQ flow), History (activity list),
  Dashboard (readiness/weak topics/balance/heatmap — plain lists, no charts yet)
- ProtectedRoute guards all pages except /login using GET /api/auth/me
- All data is live from the real backend — no mock/fake data anywhere
- Confirmed end-to-end in browser: submit MCQ → navigate to Dashboard → readiness
  score, weak topics, balance, and heatmap all update automatically (no console
  fetch needed)

## Known issue found and fixed this session (worth remembering)
`apps/api/tsconfig.json`'s `extends` chain to `tsconfig.base.json` was not being
resolved by `ts-node-dev` at runtime (though it WAS resolved correctly by
ts-jest during tests). This meant the dev server was silently compiling with
TypeScript's ES5 default target, which breaks `for...of` over Map/Set and
spread over Map/Set entries — both used in the analysis engine's topic
rollup logic. Result: all tests passed (since Jest used the correct target)
but the actual running server always returned empty mastery results.
Fixed by explicitly setting `target`, `lib`, `module`, and `moduleResolution`
directly in `apps/api/tsconfig.json` rather than relying on `extends` alone.
Lesson: passing tests do not guarantee the dev server behaves the same way —
if something similar happens again (tests green, real behavior wrong), check
for a config-resolution mismatch between ts-jest and ts-node-dev first.

## Explicitly NOT built yet (by design, per phase plan)
- DSA/SQL/React/other activity type modules (only MCQ exists)
- Recommendation engine, RAG, AI Gateway/Groq integration
- LeetCode integration
- Redis caching, background jobs
- Charts/visualizations on dashboard (Recharts) — currently plain lists
- shadcn/ui component library — currently plain Tailwind
- Admin UI for topic/question management (seed script only)
- Mock interview module, resume/JD parsing, aptitude module

## Known future concern (not urgent)
recomputeSkillProfiles reprocesses a user's ENTIRE attempt history on every
call. Fine at current scale; will need pagination/incremental computation
once a user has thousands of attempts. Not worth solving now.

## Exact next task
Pending user decision between:
1. Phase 6 (backend): add a second activity type (DSA or SQL) to validate that
   the Activity/Attempt abstraction generalizes beyond MCQ, per the original
   dependency order.
2. Continue frontend: polish/extend current pages (e.g. actual heatmap
   visualization, better practice UX) before adding backend complexity.

Do not proceed with either until instructed.

## Update: Phase 6 complete (second activity type — SQL)
Added SQL practice as a second activity type, specifically to validate whether
the Activity/Attempt abstraction generalizes beyond MCQ. Result: PARTIAL —
Activity generalized with zero changes; Attempt did not and had to become
polymorphic.

What was built:
- SqlExercise model (separate from Question — different content shape:
  prompt, canonicalQuery, expectedResultJson)
- Attempt widened: MCQ fields (questionId, selectedOptionId) and SQL fields
  (sqlExerciseId, submittedQuery, executionError) are all now nullable on the
  same row; isCorrect/timeTakenMs remain shared across types
- A real sandboxed Postgres schema ("sandbox") with sample employees/departments
  tables — student SQL actually executes against this, isolated via
  SET LOCAL search_path inside a transaction, with a statement_timeout guard
- sqlSafety.ts: keyword/pattern-based validator rejecting anything but a
  single read-only SELECT (not a real SQL parser — good enough for this
  portfolio project, not for a public product without hardening)
- GET /api/topics/:id/sql-exercises (sanitized), POST /api/activities/sql
  (executes + grades by comparing normalized result sets)
- Analysis engine now reads attempts from EITHER Question or SqlExercise via
  a shared source lookup — proven with 2026-09-12/17-style mastery rollups
  across both types
- 8 new tests (38 total passing), plus manual verification against the live
  dev server (not just Jest) given the earlier tsconfig lesson

Known limitation carried forward: sql-exercises seed data is minimal (2
exercises, 1 topic). Fine for proving the architecture; would need more
content before this is a real practice feature.

Frontend does NOT yet have a SQL practice page — backend-only this phase,
by design.

## Exact next task (updated)
Pending user decision between:
1. Phase 7: AI Gateway (Groq) — per original dependency order.
2. Frontend: build the SQL practice page + wire up whatever else is missing
   on the frontend for the two activity types that now exist.
Do not proceed with either until instructed.


## Update: Phase 6b complete (third activity type — DSA)
Added DSA as a third activity type, using Node's built-in vm module to
actually execute student-submitted JavaScript functions against test cases
(not a simplified grading shortcut).

What was built:
- DsaProblem model: prompt, functionName, starterCode, testCases (JSON array
  of {input, expectedOutput}), difficulty — separate content model like
  SqlExercise, not reusing Question
- Attempt widened a third time: dsaProblemId, submittedCode, testsPassed,
  testsTotal, hintsUsed — all nullable, alongside the existing MCQ and SQL
  fields. isCorrect = testsPassed === testsTotal (binary; partial credit is
  captured but not yet used in mastery scoring — a real product decision
  deliberately deferred, not an oversight)
- codeExecutor.ts: runs submitted code via vm.Script + vm.createContext,
  1000ms timeout per test case via runInContext's timeout option (NOT the
  Script constructor — that option only exists on runInContext/runInNewContext)
- EXPLICIT SECURITY CAVEAT (carried over from design discussion, confirmed
  by the user): Node's vm module is NOT a security boundary per Node's own
  docs. Acceptable only for this local, single-user portfolio project.
  MUST NOT be exposed to untrusted public users without a real isolation
  layer (container/gVisor/hosted execution service) in front of it. This
  should be treated as a hard blocker before any public deployment.
- GET /api/topics/:id/dsa-problems (exposes starterCode, hides testCases),
  POST /api/activities/dsa
- Analysis engine extended again to read from Question, SqlExercise, OR
  DsaProblem via the same shared source-lookup pattern
- 8 new tests (46 total), INCLUDING a live infinite-loop attack tested
  against the real running dev server (not just Jest) — confirmed the vm
  timeout actually works end-to-end and does not hang the process. This
  was done deliberately given the Phase 4/5 lesson that passing tests alone
  don't guarantee runtime behavior.

All three activity types (MCQ, SQL, DSA) now share the same Activity wrapper
and feed the same mastery/dashboard pipeline. Attempt has been widened three
times total — this is the stable shape going forward unless a 4th type
reveals another genuinely new signal need.

Frontend does NOT have a DSA practice page yet — backend-only, by design,
matching the Phase 6 (SQL) pattern before its frontend was added afterward.

## Exact next task (updated)
Pending user decision:
1. Frontend: build a DSA practice page (mirrors SqlPracticePage.tsx pattern
   — code editor textarea instead of query textarea, shows testsPassed/
   testsTotal instead of row count).
2. Phase 7: AI Gateway (Groq) — on-demand explanation for wrong answers.
3. Revisit mastery scoring to use DSA partial credit instead of binary
   correct/incorrect, now that the data exists.
Do not proceed with any until instructed.

## Update: DSA practice frontend complete
Added apps/web/src/pages/DsaPracticePage.tsx — same pattern as
SqlPracticePage.tsx (topic select -> random problem -> submit -> result),
with a code textarea pre-filled from starterCode, and a per-test-case
pass/fail breakdown shown after submission. Routed at /practice/dsa, linked
from NavBar as "DSA Practice".

Verified manually in browser: starter/incomplete code fails tests, a correct
solution (sumArray, findMax) passes all tests, matching the behavior already
confirmed via direct API calls in the previous phase. All three activity
types (MCQ, SQL, DSA) now have working frontend practice pages feeding the
same History/Dashboard pipeline.

## Future phase (explicitly deferred, not started): multi-language code execution
User asked about LeetCode-style multi-language support (Python, Java, C++,
etc.) for DSA practice. Scoped the options but deliberately deferred rather
than building now, per "no premature complexity":
- Current vm-based executor is JS-only by nature — vm IS Node's JS engine,
  it has no mechanism to run other languages at all.
- True multi-language support requires either (a) spawning real language
  runtimes as subprocesses, which is a much larger security surface than
  the already-caveated vm approach (arbitrary native code execution,
  filesystem/network/resource risk) and would need real containerization
  (Docker + cgroups + no network + ephemeral fs) to be safe — the same
  category of infrastructure LeetCode/Codeforces/HackerRank actually use;
  or (b) a hosted code-execution API (e.g. Judge0, Piston) to offload the
  sandboxing risk, at the cost of an external dependency.
- Decision: NOT started. Logged here as a clearly-scoped future phase.
  If picked up later, lean toward option (b) (hosted execution API) over
  rolling a custom container sandbox, given the project's "don't build
  premature infrastructure" principle.

## Exact next task (updated)
Pending user decision — all three activity types now have working frontend
pages. Remaining candidates per original phase plan:
1. Phase 7: AI Gateway (Groq) — on-demand explanation for wrong answers.
2. Revisit mastery scoring to use DSA partial credit (testsPassed/testsTotal)
   instead of binary correct/incorrect.
3. Multi-language DSA execution (see above — explicitly deferred, scope
   already written out if picked up).
4. Dashboard polish (real heatmap visualization, nicer charts) — still
   deferred from the original frontend milestone.
Do not proceed with any until instructed.



## Update: Phase 6b complete (third activity type — DSA)
Added DSA as a third activity type, using Node's built-in vm module to
actually execute student-submitted JavaScript functions against test cases
(not a simplified grading shortcut).

What was built:
- DsaProblem model: prompt, functionName, starterCode, testCases (JSON array
  of {input, expectedOutput}), difficulty — separate content model like
  SqlExercise, not reusing Question
- Attempt widened a third time: dsaProblemId, submittedCode, testsPassed,
  testsTotal, hintsUsed — all nullable, alongside the existing MCQ and SQL
  fields. isCorrect = testsPassed === testsTotal (binary; partial credit is
  captured but not yet used in mastery scoring — a real product decision
  deliberately deferred, not an oversight)
- codeExecutor.ts: runs submitted code via vm.Script + vm.createContext,
  1000ms timeout per test case via runInContext's timeout option (NOT the
  Script constructor — that option only exists on runInContext/runInNewContext)
- EXPLICIT SECURITY CAVEAT (carried over from design discussion, confirmed
  by the user): Node's vm module is NOT a security boundary per Node's own
  docs. Acceptable only for this local, single-user portfolio project.
  MUST NOT be exposed to untrusted public users without a real isolation
  layer (container/gVisor/hosted execution service) in front of it. This
  should be treated as a hard blocker before any public deployment.
- GET /api/topics/:id/dsa-problems (exposes starterCode, hides testCases),
  POST /api/activities/dsa
- Analysis engine extended again to read from Question, SqlExercise, OR
  DsaProblem via the same shared source-lookup pattern
- 8 new tests (46 total), INCLUDING a live infinite-loop attack tested
  against the real running dev server (not just Jest) — confirmed the vm
  timeout actually works end-to-end and does not hang the process. This
  was done deliberately given the Phase 4/5 lesson that passing tests alone
  don't guarantee runtime behavior.

All three activity types (MCQ, SQL, DSA) now share the same Activity wrapper
and feed the same mastery/dashboard pipeline. Attempt has been widened three
times total — this is the stable shape going forward unless a 4th type
reveals another genuinely new signal need.

Frontend does NOT have a DSA practice page yet — backend-only, by design,
matching the Phase 6 (SQL) pattern before its frontend was added afterward.

## Exact next task (updated)
Pending user decision:
1. Frontend: build a DSA practice page (mirrors SqlPracticePage.tsx pattern
   — code editor textarea instead of query textarea, shows testsPassed/
   testsTotal instead of row count).
2. Phase 7: AI Gateway (Groq) — on-demand explanation for wrong answers.
3. Revisit mastery scoring to use DSA partial credit instead of binary
   correct/incorrect, now that the data exists.
Do not proceed with any until instructed.

## Update: DSA practice frontend complete
Added apps/web/src/pages/DsaPracticePage.tsx — same pattern as
SqlPracticePage.tsx (topic select -> random problem -> submit -> result),
with a code textarea pre-filled from starterCode, and a per-test-case
pass/fail breakdown shown after submission. Routed at /practice/dsa, linked
from NavBar as "DSA Practice".

Verified manually in browser: starter/incomplete code fails tests, a correct
solution (sumArray, findMax) passes all tests, matching the behavior already
confirmed via direct API calls in the previous phase. All three activity
types (MCQ, SQL, DSA) now have working frontend practice pages feeding the
same History/Dashboard pipeline.

## Future phase (explicitly deferred, not started): multi-language code execution
User asked about LeetCode-style multi-language support (Python, Java, C++,
etc.) for DSA practice. Scoped the options but deliberately deferred rather
than building now, per "no premature complexity":
- Current vm-based executor is JS-only by nature — vm IS Node's JS engine,
  it has no mechanism to run other languages at all.
- True multi-language support requires either (a) spawning real language
  runtimes as subprocesses, which is a much larger security surface than
  the already-caveated vm approach (arbitrary native code execution,
  filesystem/network/resource risk) and would need real containerization
  (Docker + cgroups + no network + ephemeral fs) to be safe — the same
  category of infrastructure LeetCode/Codeforces/HackerRank actually use;
  or (b) a hosted code-execution API (e.g. Judge0, Piston) to offload the
  sandboxing risk, at the cost of an external dependency.
- Decision: NOT started. Logged here as a clearly-scoped future phase.
  If picked up later, lean toward option (b) (hosted execution API) over
  rolling a custom container sandbox, given the project's "don't build
  premature infrastructure" principle.

## Exact next task (updated)
Pending user decision — all three activity types now have working frontend
pages. Remaining candidates per original phase plan:
1. Phase 7: AI Gateway (Groq) — on-demand explanation for wrong answers.
2. Revisit mastery scoring to use DSA partial credit (testsPassed/testsTotal)
   instead of binary correct/incorrect.
3. Multi-language DSA execution (see above — explicitly deferred, scope
   already written out if picked up).
4. Dashboard polish (real heatmap visualization, nicer charts) — still
   deferred from the original frontend milestone.
Do not proceed with any until instructed.

## Update: Phase 7 complete (AI Gateway — Groq)
Added a provider-agnostic AI interface with a Groq implementation behind it,
plus one real feature: on-demand explanation for a wrong SQL or DSA attempt.

What was built:
- aiProvider.ts: minimal AiProvider interface ({ complete(prompt): Promise<string> }).
  Every other module depends only on this interface, never on groq-sdk directly —
  swapping providers later means writing one new file, touching nothing else.
- groqProvider.ts: Groq implementation. Model is openai/gpt-oss-20b.
- explainAttempt.ts: builds a single-turn prompt from {prompt, submission,
  errorDetail} — explicitly no RAG, no attempt history, no multi-turn context,
  per the original phase scope. Explicitly instructs the model not to hand over
  the full corrected solution (hint, not answer).
- POST /api/ai/explain (auth required): looks up a user's own activity by id,
  confirms it was actually incorrect and is SQL or DSA type, then calls the
  provider. Returns 404 if not found/not owned, 400 if already correct or
  wrong type, 502 if the AI call itself fails.
- Tests mock the AiProvider interface — no real Groq calls in the test suite
  (fast, free, won't break CI on an API outage). Verified separately via a
  live browser console call against the real Groq API.
- 3 new tests (49 total passing).

Known issue hit and fixed during this phase, worth remembering: the first
model name I used (llama-3.1-8b-instant) returned 404 model_not_found. Root
cause was NOT a renamed/retired model — Groq had moved both llama-3.1-8b-instant
AND llama-3.3-70b-versatile to an Enterprise/contact-sales tier, unavailable
on a standard developer API key. Fixed by switching to openai/gpt-oss-20b,
which is in Groq's Production tier. Lesson: when a Groq model 404s, check
whether it's a tier/access issue (via console.groq.com/docs/models) before
assuming the model name itself is wrong — the two look identical from the
error message alone.

Frontend does NOT yet have a "Explain this" button anywhere — backend-only,
by design, matching the pattern from Phases 6/6b before their frontends
were added afterward.

## Exact next task (updated)
Pending user decision:
1. Frontend: add an "Explain" button to SQL/DSA practice pages (and maybe
   History) that calls POST /api/ai/explain when an attempt was incorrect.
2. Revisit mastery scoring to use DSA partial credit instead of binary.
3. Multi-language DSA execution (already scoped as a future phase above).
4. Dashboard polish (real heatmap, charts) — still deferred.
Do not proceed with any until instructed.

## Update: Explain button wired up on frontend + topic dropdown scoping fixed
Added an "Explain why this is wrong" button to both SqlPracticePage.tsx and
DsaPracticePage.tsx, shown only when result.isCorrect === false (matching
the backend's own rule that correct attempts can't be explained). Calls
POST /api/ai/explain with the real activityId from the submit response.
Explanation state is cleared on "Next exercise"/"Next problem" so it never
carries over to a new question.

Verified live: both SQL and DSA explanations returned real, specific,
helpful guidance from Groq (didn't hand over the full solution, pointed
toward the actual fix) — e.g. DSA explanation correctly identified a
constant-return bug and suggested iterating with reduce/for; SQL explanation
correctly identified a missing JOIN and bad column reference.

Also fixed: both practice pages were showing ALL leaf topics regardless of
subject (Arrays/Trees/Joins all appeared on both SQL and DSA pages). Fixed
by filtering leaf topics to only those whose parentId matches the specific
subject topic (found by slug 'sql' or 'dsa') rather than just "has any
parent". PracticePage.tsx (MCQ) intentionally left unchanged since MCQ
questions span both subjects legitimately.

All three activity types (MCQ, SQL, DSA) are now fully usable end-to-end
through the UI, each correctly scoped to its own topics, each with working
AI-backed explanations for wrong SQL/DSA attempts.

## Exact next task (updated)
Pending user decision:
1. Revisit DSA mastery scoring to use partial credit (testsPassed/testsTotal)
   instead of binary correct/incorrect.
2. Dashboard polish — real heatmap visualization, nicer charts (Recharts),
   still deferred from the original frontend milestone.
3. Multi-language DSA execution (already scoped as a future phase).
4. Add "Explain" to MCQ wrong answers too (currently MCQ only has the static
   DB explanation field, not AI-generated — could extend ai/explainAttempt.ts
   to support MCQ as a 4th type if desired).
Do not proceed with any until instructed.

## Update: DSA partial credit in mastery scoring
recomputeSkillProfiles now uses a per-attempt correctnessRatio instead of a
binary isCorrect flag when weighting mastery:
- MCQ/SQL: ratio is still exactly 1 or 0 (isCorrect) — no behavior change,
  confirmed by all pre-existing MCQ/SQL tests still passing unmodified
- DSA: ratio is testsPassed/testsTotal — e.g. 2/3 tests passed now
  contributes 0.67 toward mastery instead of being flattened to 0
This makes mastery scores more accurate for DSA specifically, since a
near-correct solution is no longer scored identically to a completely wrong
one. 1 new test added (50 total passing) proving a partial-credit attempt
produces a mastery score strictly between 0 and 1, not a clean binary value.

## Exact next task (updated)
Pending user decision:
1. Dashboard polish — real heatmap visualization, nicer charts (Recharts),
   still deferred from the original frontend milestone.
2. Add AI explanations to MCQ wrong answers too (currently only SQL/DSA).
3. Multi-language DSA execution (previously scoped, deferred).
Do not proceed with any until instructed.

## Update: Dashboard visual polish complete
Replaced plain-list dashboard sections with real visualizations, using
Recharts (installed in apps/web) plus one custom component:
- Weak Topics: horizontal bar chart (mastery % per topic), hover tooltip
- Preparation Balance: pie chart with legend, labeled slices
- Recent Activity: NEW apps/web/src/components/ActivityHeatmap.tsx — a
  hand-built GitHub/LeetCode-style calendar grid (Recharts has no calendar
  heatmap chart type, so this is custom CSS/divs, not a new library), color
  intensity scales with daily activity count, native title tooltip per cell
- Readiness Score deliberately left as a plain big number — a single value
  doesn't benefit from a chart

Confirmed working in browser by user. This closes out the "no advanced
dashboard features yet" deferral from the original frontend milestone — the
dashboard now matches the original product spec's "GitHub/LeetCode-style
activity heatmap" requirement.

## Exact next task (updated)
Pending user decision:
1. Add AI explanations to MCQ wrong answers too (currently only SQL/DSA).
2. Multi-language DSA execution (previously scoped, deferred).
3. Something else / new direction.
Do not proceed with any until instructed.


## Update: Dashboard visual polish complete
Replaced plain-list dashboard sections with real visualizations, using
Recharts (installed in apps/web) plus one custom component:
- Weak Topics: horizontal bar chart (mastery % per topic), hover tooltip
- Preparation Balance: pie chart with legend, labeled slices
- Recent Activity: NEW apps/web/src/components/ActivityHeatmap.tsx — a
  hand-built GitHub/LeetCode-style calendar grid (Recharts has no calendar
  heatmap chart type, so this is custom CSS/divs, not a new library), color
  intensity scales with daily activity count, native title tooltip per cell
- Readiness Score deliberately left as a plain big number — a single value
  doesn't benefit from a chart

Confirmed working in browser by user. This closes out the "no advanced
dashboard features yet" deferral from the original frontend milestone — the
dashboard now matches the original product spec's "GitHub/LeetCode-style
activity heatmap" requirement.

## Exact next task (updated)
Pending user decision:
1. Add AI explanations to MCQ wrong answers too (currently only SQL/DSA).
2. Multi-language DSA execution (previously scoped, deferred).
3. Something else / new direction.
Do not proceed with any until instructed.


## Update: AI explanations extended to MCQ
explainAttempt.ts and ai.controller.ts widened to support MCQ as a third
explainable type alongside SQL/DSA. Unlike SQL/DSA, the MCQ prompt doesn't
instruct the model to withhold the answer — the correct option is already
revealed to the student the moment they submit, so there's nothing left to
guard; the AI's role here is purely explaining the underlying concept.

Frontend: added "Explain further" button to PracticePage.tsx (MCQ), shown
only on incorrect answers, positioned below the existing static DB
`explanation` field (the canned one-liner) so the two are visually distinct
— static short answer first, AI-generated deeper explanation on demand.

Verified live: real Groq-generated explanation for an O(n) vs O(1) array
access question — correctly explained contiguous memory + address
arithmetic, distinct from and more detailed than the canned explanation
shown above it.

1 new test added (51 total passing). All three activity types (MCQ, SQL,
DSA) now have AI-backed "explain this wrong answer" support, fully wired
end-to-end through the UI.

## Exact next task (updated)
Pending user decision:
1. Multi-language DSA execution (previously scoped, deferred).
2. Something else / new direction — core feature set per the original
   phase plan (MCQ, SQL, DSA activity types + mastery + dashboard + AI
   explanations) is now complete and fully working end-to-end.
Do not proceed with any until instructed.

## Update: Content expansion — OS, DBMS, Computer Networks added
Added 3 new top-level subjects via a new seed script (prisma/moreTopicsSeed.ts,
run via npm run seed:more-topics) — a separate script from the original
seed.ts since that one can't be safely re-run (hits unique slug constraint).
Added: Operating Systems (Process Management, Memory Management), DBMS
(Normalization, Transactions), Computer Networks (OSI Model, TCP/IP) — 7 MCQs
total across 6 new leaf topics. No code changes needed — MCQ practice/dashboard
already fetch topics dynamically. Verified working end-to-end by user: new
topics appear in Practice dropdown, grade correctly, flow into Dashboard.

## Update: Content expansion — OOP, Git, Aptitude added
Second content-expansion seed script (prisma/moreTopics2Seed.ts, run via
npm run seed:more-topics-2). Added: OOP (Core Concepts, Design Principles),
Git (Git Basics, Branching & Merging), Aptitude (Quantitative, Logical
Reasoning) — 7 more MCQs across 6 new leaf topics. Verified working by user
in Practice dropdown. Total subjects covered so far: DSA, SQL, OS, DBMS,
Computer Networks, OOP, Git, Aptitude (8 of 15 from original spec).
Remaining uncovered: JavaScript, React, Node.js, MongoDB, System Design,
AI/ML basics, Technical/HR interviews, Resume/JD prep.

## Update: Content expansion — JavaScript, React, Node.js, MongoDB, System Design, AI/ML Basics added
Two more seed scripts (moreTopics3Seed.ts via seed:more-topics-3,
moreTopics4Seed.ts via seed:more-topics-4). Added:
- JavaScript (Closures & Scope, Async & Promises)
- React (Hooks, Component Lifecycle)
- Node.js (Event Loop, Modules & npm)
- MongoDB (Documents & Collections, Indexing)
- System Design (Scalability, Caching)
- AI/ML Basics (Supervised Learning, Model Evaluation)
14 more MCQs across 12 new leaf topics. All verified working in Practice
dropdown by user.

Total subject coverage now: DSA, SQL, OS, DBMS, Computer Networks, OOP, Git,
Aptitude, JavaScript, React, Node.js, MongoDB, System Design, AI/ML Basics
— 14 of 15 original spec subjects now have at least minimal MCQ content
(1-2 questions per leaf topic — enough to prove breadth, not deep practice
banks yet). Only remaining uncovered: Technical/HR interview prep and
Resume/JD prep, which aren't MCQ-shaped content anyway — they'd need their
own activity type (e.g. a mock interview module), not more seed data.

Each seed script is a separate file (not edits to the original seed.ts)
since re-running a script that already created its topics hits the unique
slug constraint. This pattern (moreTopicsNSeed.ts, seed:more-topics-N) is
now established for future content additions too.

## Update: Resume Review feature complete
Added a standalone AI-backed Resume Review feature — deliberately NOT part
of the Activity/Attempt pipeline (no "correct answer" to grade, so it
doesn't belong there). Stateless v1: no database table, no saved history
yet — input in, AI feedback out. Reuses the existing AiProvider/GroqProvider
infrastructure from Phase 7, no new provider code needed.

What was built:
- reviewResume.ts: prompt builder asking for structured STRENGTHS/GAPS/
  SUGGESTIONS feedback, explicitly instructed to be honest/direct rather
  than generically positive. Works with or without a target job description.
- POST /api/ai/review-resume (auth required)
- ResumeReviewPage.tsx: two textareas (resume, optional JD) + feedback
  display
- 2 new tests (53 total passing)

Known issue hit and fixed during this phase: first live attempt failed with
"Groq returned an empty response" — root cause was MAX_TOKENS=300 (set
during Phase 7 for short single-sentence explanations) being too low for a
longer structured 3-section response; some of that budget may also go to
internal reasoning tokens on this model. Fixed by raising MAX_TOKENS to
1024 in groqProvider.ts. This constant is now shared across ALL ai module
features (explain + review-resume) — worth revisiting if a future feature
needs a different budget than the others.

Verified live: real structured feedback for an actual resume — correctly
identified lack of concrete project metrics, missing DevOps/cloud skills,
and gave specific actionable suggestions with example quantified bullet
points. Not generic praise — matches the "be honest and direct" instruction
in the prompt.

Harmless, pre-existing noise observed during this test run (not a new bug):
a console.error from a fire-and-forget recompute call racing against test
cleanup (afterAll deleting the test user before the background recompute
finished) — a foreign key violation that's already safely caught by the
existing .catch(), just visibly logged by Jest. Doesn't affect test
correctness or pass/fail status. Not worth fixing given it's cosmetic and
inherent to the deliberate fire-and-forget design from the auto-recompute
phase.

## Exact next task (updated)
Pending user decision. Remaining pieces from the original module list:
1. Technical/HR interview prep (mock interview module) — the one major
   piece left unbuilt. Structurally different again (likely a multi-turn
   conversational flow, not single-shot like explain/review-resume) —
   would need its own design discussion before implementation.
2. Save Resume Review history (small schema addition, now that v1 works).
3. Multi-language DSA execution (previously scoped, deferred).
Do not proceed with any until instructed.

Update: Mock Interview feature complete

Added a multi-turn AI-driven mock technical interview — the most structurally different feature yet (everything before this was single-shot request/response; this holds conversation state across 3 question/answer turns).

What was built:

MockInterviewSession model: userId, topicId, transcript (JSON array of {question, answer}), technicalAccuracy/communication/completeness (0-100 each), overallFeedback. Deliberately NOT part of Activity/Attempt — not a gradeable correct/incorrect event, same reasoning as Resume Review.
In-memory session store (Map<sessionToken, session>) in interview.service.ts — explicitly noted as fine for a single-instance local app, would need Redis or a DB-backed session if ever run across multiple server instances. Not solved now, flagged for later.
POST /api/interview/start (topicId -> first AI-generated open-ended question), POST /api/interview/answer (records answer, either returns next AI question or, on the 3rd answer, triggers AI scoring via a structured TECHNICAL_ACCURACY/COMMUNICATION/COMPLETENESS/FEEDBACK response format, parses it with regex, saves the session, returns final scores)
Questions are freshly AI-generated per session (not drawn from the seeded MCQ bank) per explicit user decision — more realistic, avoids multiple- choice-shaped questions in a conversational interview
MockInterviewPage.tsx: topic select -> auto-starts -> question/answer loop -> final scores + feedback screen
2 new tests (55 total), using a mocked AiProvider since this involves multiple sequential AI calls per session — real live verification done manually instead (see below)

Known issues hit and fixed during this phase (both config/process mistakes, not logic bugs):

The MockInterviewSession model got duplicated in schema.prisma (added twice across two separate edit instructions) — caused prisma generate to produce a broken/incomplete client, surfacing as "Cannot read properties of undefined (reading 'create')" at runtime. Fixed by providing the complete corrected schema file with exactly one copy of each model.
Even after fixing the duplicate and running prisma generate successfully, the actual migration had never been applied — prisma migrate dev was never run for this schema change (likely silently skipped earlier while the duplicate-model error was still present). Fixed by running npx prisma migrate dev --name add_mock_interview_session directly. Lesson reinforced (same as earlier phases): prisma generate and prisma migrate dev are two separate steps that both need to actually complete — a successful generate does not imply the database schema is in sync.

Verified live end-to-end: 3 genuinely different AI-generated questions in one session (on DSA: max subarray/Kadane's, distinct-value subarray/sliding window, kth smallest element/Quickselect), real honest scoring (80/70/70), and specific written feedback correctly referencing which algorithms were named correctly vs. where explanations were vague — not generic praise.

All major features from the original module list are now built: MCQ, SQL, DSA activity types with real grading; mastery tracking with partial credit; dashboard with visualizations; AI explanations for wrong SQL/DSA/MCQ answers; Resume/JD review; and now mock technical interviews. 14 of 15 content subjects seeded. 55 tests passing.

Exact next task (updated)

Core feature set is essentially complete per the original spec. Remaining candidates, all optional polish/extension rather than core gaps:

HR interview variant (current mock interview is technical-only).
Save/view Resume Review history (currently stateless).
Multi-language DSA execution (previously scoped, deferred).
A "My Mock Interview History" page showing past MockInterviewSession records (the data is already saved, just not surfaced in a list view).
Recommendation engine (explicitly deferred from the very start of the project per original "what NOT to build yet" list) — now that there's substantial real usage data across 3 activity types, this might finally be ready to consider, if desired. Do not proceed with any until instructed.
