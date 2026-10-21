# Class Cover

Last-minute cover app for Pilates studios, starting with Stretch Pilates (South Africa). A studio manager posts a cover, qualified teachers are pinged by push and WhatsApp, and the first to accept takes the class. Planned leave cover is out of scope (it lives in Talent OS).

- Build plan: https://claude.ai/code/artifact/26d7eb28-f72a-4de5-b2b4-241a60edd23e
- Clickable prototype: `docs/prototype.html` (also https://claude.ai/artifact/JAenm1qkk2DE11FSHKHBA9)

## Stack
- Next.js 15 (App Router, `src/`), Tailwind v4, TypeScript. Mobile-first PWA.
- Supabase: auth (email + password, email link as fallback; `/account/password` sets a password while signed in), Postgres with RLS, storage (private `certificates` bucket). Project `class-cover` (ref qkflbtwcrtrnjbzmgvbs), org "Stretch Pilates", region eu-west-2. Timetable seed: `supabase/seed/stretch_timetable.sql` (6 studios, 231 classes, from Octiv).
- Vercel for hosting: https://class-cover-five.vercel.app (auto-deploys from `main`; team is on Hobby, move to Pro before commercial use).
- WhatsApp via the studio's existing **ManyChat** WhatsApp Business account (ManyChat API triggers a flow holding a Meta-approved template). Push via Web Push.
- Payments later via Paystack (Stripe doesn't serve SA businesses). Version 1 only tracks covers and exports a bank payment file and Xero CSV.

## Product rules (decided)
- Only studio managers (or someone acting for the studio) post covers.
- A request lists accepted trainings; only teachers with a verified matching training are pinged. For now Stretch accepts three: Stretch Pilates, BASI Pilates and Body Intellect teacher training, each valid for every class.
- Waves: preferred teachers first; after `studios.wave_delay_minutes` (15) unclaimed, vetted locums too. Managers can open early.
- First qualified teacher to accept wins (`accept_cover` RPC locks the row).
- Rate: `studios.default_rate` R275, editable per request. No automatic short-notice premium.
- Dropout: `drop_cover` RPC re-opens the request from the preferred wave. Late = under 24h before class. `studios.dropout_limit` (3) late dropouts in a quarter moves preferred -> locum.
- Vetting stages per studio: to_meet -> checking_documents -> locum -> preferred (or declined). `studios.meet_first` toggles the meeting step.
- Teachers own their profile. `studio_teachers` holds each studio's relationship (tier, notes).
- Marketplace visibility is the teacher's choice: `studios_i_work_with` or `verified_studios`. Only managers of approved studios can browse. Contact details (`profile_contacts`) are shared only with studios that work with the teacher; ID and bank (`profile_private`) only with studios where the teacher is approved, plus the platform admin.

- Handover notes: `cover_requests.notes` is visible to every eligible teacher (no client names or health details); `cover_request_access.access_notes` (door codes, parking) only to the teacher holding the class.
- Teacher availability (`teacher_preferences`) filters alerts only, not what they can see in the app.
- Expired first aid or insurance (`profiles.*_expiry`) blocks a teacher in `private.eligible_for`.
- Urgent: classes starting within 3 hours (`URGENT_HOURS`) or flagged by the manager skip the preferred head start. The locum wave also opens on its own once the head start passes (computed in `eligible_for`, no cron).
- Check-in: each location has a `checkin_code`; the QR poster links to `/checkin/<code>`, which calls `check_in()`.
- Pay: only manager-confirmed covers count. Monthly invoice at `/manage/pay/invoice`, bank file and Xero CSV at `/manage/pay/export`.
- Pricing: free for instructors. Studios will be charged later; `cover_assignments.platform_fee` is recorded per cover (0 for now) and shown on the invoice.

## Conventions
- Money in whole rands (int). Display as `R275` (en-ZA). Times stored as timestamptz, shown in Africa/Johannesburg.
- Schema changes go in a new file under `supabase/migrations/`. Never edit an applied migration.
- Colours come from the tokens in `src/app/globals.css` (e.g. `bg-surface`, `text-muted`, `bg-accent`). Fonts: Bricolage Grotesque (display), Figtree (body), JetBrains Mono (times, money).
- Write UI copy plainly, from the teacher's or manager's side ("Accept cover", "Can't make it").
- POPIA: collect consent at signup (`profiles.popia_consent_at`), never expose ID/bank fields outside the policies above, keep certificates in the private bucket.

## Commands
- `npm run dev` — run locally at http://localhost:3000
- `npm run build` — production build check
- Env vars: copy `.env.example` to `.env.local`.

## Build phases
1. Foundations: logins, teacher signup (trainings ticked, no upload; POPIA consent), studio/locations/timetable, vetting pipeline.
2. Cover loop: post, waves, push + WhatsApp, accept, re-post on dropout. Gate: pilot with 5-10 teachers for 2 weeks.
3. Pay and launch: confirm covers, monthly pay report, bank file, Xero export, data download/delete.
4. Marketplace: profiles and visibility, find instructors, requests, platform approval of studios.
