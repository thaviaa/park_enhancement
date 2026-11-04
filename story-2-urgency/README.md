# Story 2 – Default Urgency to One Week and let Park users edit it

## What Scott calls "priority"
It is the **Urgency** catalog variable on *Park & Rec Work Order* (`urgency`, values
`emergency`, `one_day`, `one_week`, `one_month`), not `task.priority`. Today it has no default.

## Solution

| # | Artifact | Purpose |
|---|----------|---------|
| 01 | Fix script | Default `urgency` = `one_week`; Write roles on `urgency` = `park`; lock every other variable after submission |
| 02 | Script Include `ParkUrgencyUtil` | Urgency → priority map (Emergency=1, One Day=2, One Week=3, One Month=4) and sync logic |
| 03 | Business Rules | Set priority on task insert; re-sync RITM + tasks + work note when the urgency variable changes |
| 04 | Catalog Client Script | UX: on RITM/SCTASK forms all variables read-only except Urgency for Park users |
| 05 | Fix script | Backfill priority on existing Park tasks (needed for Story 4 urgency breakdown) |
| 06 | Background script | Read-only diagnostic: why Urgency is read-only on SCTASK |
| 07 | Fix script | Sets script 04's type to onLoad; deactivates legacy "set variables read only" client script that locked Urgency |

### Why priority sync
Variables can't be grouped on easily in reports or SLA conditions. Mirroring urgency into
`priority` gives Story 3 per-urgency SLA targets (optional) and Story 4 a "by urgency" breakdown.

## Build order
1. Create update set `PRK Enhancements - Story 2 Urgency`.
2. (If limiting to supervisors) create role `park_supervisor` and change `EDIT_ROLE` in 01 and the role in 04.
3. Script Include 02 → Business Rules 03 → Catalog Client Script 04.
4. Run fix script 01, then 05.

## Pre-checks in Test
- **Can Park users save the SCTASK?** The `park` role grants only a scripted *read* ACL on `sc_task`.
  Scott's write access appears to come from `task_editor` / `sn_request_write`. Impersonate a Park
  user who is *not* Scott and confirm they can save a task before relying on this.
- Confirm `glide.sc.audit_variables` is `true` so urgency changes show in history (work note is added regardless).
- Check the Service Operations Workspace / mobile variable editor if Park staff use it —
  `setVariablesReadOnly` is classic-UI only; Write roles still enforce on the server.

## Test cases
1. New request → Urgency pre-selected as One Week; requester can change it before submitting.
2. Submit with Emergency → SCTASK priority = 1 - Critical.
3. As a Park user, open the SCTASK, change Urgency to One Month, save → RITM and sibling tasks priority = 4, work note added.
4. As a Park user, try to change Park Name / Problem Description → read-only (and rejected on save).
5. As a non-Park ITIL user → Urgency read-only.
