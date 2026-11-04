# Story 4 – Park Work Order dashboard

## Mapping Scott's asks to reports

| Scott's ask | Report(s) | Table |
|---|---|---|
| Completed vs submitted, pick a time frame | `PRK WO - Submitted vs Completed by Team`, `... by Week` | `sc_task` |
| % responded within 48 h, no weekends | `PRK WO - 48 Hour Response (Met vs Breached)`, `... by Team` | `task_sla` (Story 3) |
| How many submitted, pick a time frame | `PRK WO - Submitted`, `PRK WO - Submitted by Team and Urgency` | `sc_task` |
| *(bonus)* What's late right now | `PRK WO - Open and Past 48 Hours` | `task_sla` |

`01_fix_create_reports.js` creates all seven, shared to the `park` role, with **no date condition** —
the dashboard filter supplies the time frame.

## "Completed vs submitted" – two possible meanings
1. **Cohort (built):** of the work orders *submitted* in the range, how many are now complete.
   One date field (`sys_created_on`), works with a single dashboard date filter.
2. **Throughput:** work orders *closed* in the range vs work orders *opened* in the range
   (different records). Needs `closed_at` for one and `sys_created_on` for the other.
   If Scott means this, the cleanest route is Performance Analytics: two automated indicators
   (*Number of Park WOs opened*, *Number of Park WOs closed*, daily collection) plus a formula
   indicator for % within SLA — PA handles "pick a time frame" natively and keeps history.

Confirm with Scott; the cohort version answers "are we keeping up with what came in."

## Build the dashboard (UI)
1. *Platform Analytics > Dashboards > New* → **Park Work Order Dashboard**.
2. Add an **interactive Date filter** "Submitted date":
   - `sc_task` → `sys_created_on`
   - `task_sla` → `task.sys_created_on` (so SLA reports filter on when the WO was submitted)
   - Default: *Last 30 days*.
3. Optional **Assignment group** filter: `sc_task.assignment_group`, `task_sla.task.assignment_group`.
4. Layout:
   - Row 1: `Submitted` (score) · `48 Hour Response (Met vs Breached)` (donut, show %)
   - Row 2: `Submitted vs Completed by Week` · `Submitted vs Completed by Team`
   - Row 3: `48 Hour Response by Team` · `Submitted by Team and Urgency`
   - Row 4: `Open and Past 48 Hours` (list)
5. Share the dashboard with role **park** (viewer).
6. Paste the dashboard sys_id into `02_fix_create_module.js` and run it.

## Access checks
- Park users need **read on `task_sla`** — ACL in `story-3-sla/04_acl_task_sla_read.js`.
- Impersonate a Park user who is *not* Scott (he has extra roles) and confirm the dashboard,
  each widget, and drill-down lists load.
- If dashboards in this instance require a viewer role, grant it via the `park` role's Contains Roles.

## ⚠️ Security finding while reviewing the `park` role
The existing `sc_task` read ACL (`220bd7ff975802100ae037300153afd9`) is scripted as
`if (gs.hasRole('park')) answer = true;` with **no record condition** — Park users can read
*every* catalog task in the instance, not just Park work orders. The reports filter to Park
work orders, but drill-downs or a changed filter would show other departments' tasks.
Recommend tightening it in a separate story:
```js
answer = gs.hasRole('park') &&
         current.request_item.cat_item == '00860b96970c02500ae037300153afe8';
```

## Test cases
1. Pick *Last 7 days* → all widgets change; counts match a manual `sc_task` list with the same filter.
2. A Fri 3 PM WO moved to WIP Mon 9 AM shows as **Met**.
3. Group filter = PRK Plumbing Team → only Plumbing data.
4. Park user drills into a donut slice → sees `task_sla` list for Park WOs only.
5. Non-Park ITIL user → dashboard module hidden.
