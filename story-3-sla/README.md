# Story 3 – 48-business-hour response SLA

## Current state (Test)
No active SLA definitions on `sc_task` or `sc_req_item`, so nothing measures response time today.

## The one decision that matters: schedule shape
SLA durations count only *schedule* time.

| Schedule | Duration | Fri 3:00 PM submit is due | Fits Scott's ask? |
|---|---|---|---|
| **24x5** (Mon 00:00 – Fri 23:59) | 48 h | **Tue 3:00 PM** | ✅ "48 hours less weekends" |
| 8–5 Mon–Fri (9 h/day) | 48 h | ~Mon of the *following* week | ❌ |
| 8–5 Mon–Fri | 18 h (2 × 9 h) | Tue 3:00 PM (8–5 clock) | ✅ if he wants after-hours excluded too |

Default in the script: **24x5 + 48 h**. Flip `USE_8_TO_5` if Scott prefers business hours.

## Solution

| # | Artifact | Purpose |
|---|----------|---------|
| 01 | Fix script | Creates schedule `PRK Trades Mon-Fri 24x5` and OLA `PRK Work Order - 48 Business Hour Response` on `sc_task` |
| 02 | Fix script | `SLARepair` backfill for tasks since 1/1/2026 so reports have history |
| 03 | Optional BR | "First response" timestamp, if *responded* = first work note |
| 04 | ACL | `task_sla` read for `park`, scoped to Park work orders |

### SLA definition
- **Start:** `request_item.cat_item = Park & Rec Work Order` — retroactive, from task `sys_created_on`
- **Stop (default):** State = Work in Progress or Closed Complete
- **Cancel:** Closed Incomplete / Closed Skipped
- **Timezone:** US/Eastern from the definition, so a requester's profile timezone doesn't shift the clock

### Why not "Assigned to is not empty" as the stop
In the Park list most tasks show the same tech per team (e.g. Fencing-Gate → Nick Mccord), which
suggests assignment may happen automatically at creation. If so, that SLA would stop at 0 minutes.
Check one task's history before choosing it.

## Optional: per-urgency targets
Story 2 syncs urgency → `priority`. To give Emergency / One Day tighter targets, copy the
definition per urgency and add `^priority=1` (etc.) to each start condition. Reset condition
"Priority changes" lets the clock re-target when urgency is changed.

## Build order
1. Update set `PRK Enhancements - Story 3 SLA`.
2. Run 01 → verify the definition in *Service Level Management > SLA Definitions*.
3. Add county holiday schedule as an *Excluded* child schedule, if one exists.
4. Create ACL 04.
5. Run 02 in Test, spot-check, then plan for PROD.

## Test cases
1. Task created Fri 3:00 PM → SLA planned end Tue 3:00 PM.
2. Task created Sat 10:00 AM → planned end Tue 11:59 PM (clock starts Mon 00:00).
3. Move to Work in Progress at 30 h → stage Completed, not breached.
4. Leave Open past 48 business hours → breached.
5. Close Skipped → SLA cancelled (excluded from % metrics).
6. Impersonate a Park user → SLA related list visible on the task; not visible on non-Park tasks.

## Open questions (from the story)
Definition of *responded*, 24x5 vs 8–5, holidays, per-urgency targets.
