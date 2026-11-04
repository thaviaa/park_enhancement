# Park & Rec Trades Operations Enhancements

ServiceNow build for Scott Hyatt's 11/3/2026 request (Park & Recreation, Maintenance & Ops).
Instance reviewed: **mecknctest** (Test). Build and validation now happening in **mecknsandbox** (Sandbox).

> sys_ids below were read from Test. If Sandbox wasn't cloned from Test, verify each one
> (catalog item, `park` role, `sc_task` read ACL, Service Catalog app menu) before running scripts.

| Story | Folder | Summary |
|---|---|---|
| 1 | — | Move Tyler Kinslow from PRK Welding Team to PRK Plumbing Team (admin change, no code) |
| 2 | [`story-2-urgency`](story-2-urgency) | Urgency defaults to One Week; Park users can change it after submission; urgency mirrored to `priority` |
| 3 | [`story-3-sla`](story-3-sla) | 24x5 schedule + 48 h response OLA on Park work order tasks, with backfill |
| 4 | [`story-4-dashboard`](story-4-dashboard) | Reports, dashboard, and module for submitted / completed / 48 h response rate |
| 5 | [`story-5-workspace`](story-5-workspace) | Park Trades Workspace: no Incident widgets, Active Tasks panel, Park lists, Park-only landing |

## Key facts from Test (verify in Sandbox)
- Catalog item **Park & Rec Work Order** – `00860b96970c02500ae037300153afe8`
- Role **park** – `c448fd98979c8610500675611153af7d`; contains `sn_request_write`; granted to 18 PRK groups
- Park modules *Open Park Tasks* / *All Park Tasks* under Service Catalog (`sc_task`, view `park`)
- `urgency` variable: Emergency / One Day / One Week / One Month, no default
- No active SLA definitions on `sc_task` / `sc_req_item`

## Dependency order
Story 2 → Story 3 → Story 4 → Story 5  (Story 4's urgency breakdown uses Story 2's priority sync;
its response-rate reports use Story 3's SLA; Story 5's workspace reuses all three).

## Open questions for Scott
1. Who can change urgency — all Park users or supervisors only?
2. What counts as "responded" — Work in Progress, assigned to a tech, or first work note?
3. 24x5 (weekends only excluded) or 8–5 business hours? County holidays excluded?
4. Same 48 h target for every urgency, or tighter for Emergency / One Day?
5. "Completed vs submitted": of the WOs submitted in the period, or closed-in-period vs opened-in-period?

## Also found
The existing `park` read ACL on `sc_task` has no record condition, so Park users can read every
catalog task in the instance. See `story-4-dashboard/README.md`.
