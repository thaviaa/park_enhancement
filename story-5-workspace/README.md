# Story 5 – Park Trades Workspace

## Problem
Park users land in **Service Operations Workspace** (SOW). SOW's home page is built for ITSM:

| SOW widget | What Park users see | Why |
|---|---|---|
| Incidents assigned to you | Access Restricted | `park` role has no Incident read / `report_view` ACL |
| Incident SLAs | Access Restricted | same |
| Unassigned incidents | Access Restricted | same |
| Catalog tasks assigned to you | Works (1 open) | `park` can read `sc_task` |
| Upcoming | "Nothing coming up" | SOW's panel shows dated activities (due today/tomorrow), not active tasks |

Granting Incident access to hide the locks would be wrong. Reworking SOW's shared home page
would affect every ITSM user. A purpose-built workspace scoped to the `park` role is cleaner.

## Solution overview
| # | Piece | How | File |
|---|---|---|---|
| A | Workspace shell, home + record page | UI Builder wizard (manual) | this README §1 |
| B | Home page widgets + **Active Tasks** panel (replaces Upcoming) | UI Builder (manual), queries below | this README §2–3 |
| C | List menu config + 5 lists (auto-linked to the experience) | Fix script | `01_fix_create_list_menu.js` |
| D | Nav module + default landing for Park-only users | Fix script | `02_fix_module_and_landing.js` |
| E | Keep new Park users landing in the workspace | Business rule | `03_br_park_landing_on_role_grant.js` |

Update set: **PRK Enhancements - Story 5 Workspace**.

> Instance: building in **mecknsandbox**. Story 2's fix script 01 has run there (validated on SCTASK0082356).

---

## 1. Create the workspace (UI Builder)
1. *Now Experience Framework > UI Builder* → **Create** → **Experience** → template **Workspace**.
2. Settings:
   - Name: **Park Workspace**
   - App shell UI: **Workspace App Shell** (if using *Create an experience* instead of the workspace wizard, also create the List menu configuration and record page manually)
   - URL path: **`park-workspace`** → workspace URL `/now/park-workspace/home`
   - Landing page: **Home**
   - Roles: **`park`** (the wizard creates the UX route ACL from this)
3. Finish the wizard. It creates the experience, the app config, a **List menu configuration**,
   a Home page, and a default Record page.
4. Open *System Definition > Access Control*, filter `type=ux_route` and `name` contains `park`.
   Confirm the route ACL requires **`park`**, and that no generic `canvas_user`-only rule lets
   other users in.
5. Copy the sys_id of the **List menu configuration** the wizard created
   (*Workspace Experience > Administration > List Menu Configuration*, name *Park Trades Workspace…*)
   into `01_fix_create_list_menu.js`.

## 2. Home page (UI Builder)
Delete the template's sample widgets. Add one **Data Visualization** row (4 single-score / donut
tiles) plus a right-hand **Active Tasks** list. Every data source uses table **`sc_task`** and
starts with the Park work-order filter:

```
PARK = request_item.cat_item=00860b96970c02500ae037300153afe8^active=true
ME   = assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe        (dynamic filter "Me")
MYGR = assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744   (dynamic filter "One of My Groups")
```
> Verify those two dynamic-filter sys_ids in `sys_filter_option_dynamic` on this instance.

| Tile | Viz | Condition | Group by |
|---|---|---|---|
| My open tasks | Donut | `PARK ^ ME` | `state` |
| Unassigned in my groups | Single score | `PARK ^ MYGR ^ assigned_toISEMPTY` | — |
| Open tasks by urgency | Bar | `PARK ^ MYGR` | `priority` (synced from urgency, Story 2) |
| Past 48 hours | Single score | `task_sla`: `sla.name=PRK Work Order - 48 Business Hour Response^stage=in_progress^has_breached=true^task.assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744` | — |

Keep the **Your work / Your team's work** tab pattern if you want: tab 1 swaps `MYGR` for `ME`.

Tile click → event **Open list** with the same table + condition, so the user drills into a
filtered list inside the workspace (template's *Link to destination* → `list` page).

## 3. Active Tasks panel (replaces "Upcoming")
Right column, **List** component (or *Simple List* for a compact card look):

- Data resource: *Look Up Multiple Records* on `sc_task`
- Condition: `PARK ^ ME ^OR MYGR` → encoded:
  ```
  request_item.cat_item=00860b96970c02500ae037300153afe8^active=true^assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe^ORassignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744^ORDERBYpriority^ORDERBYsys_created_on
  ```
- Columns / card fields: `number`, `short_description`, `priority` (urgency), `assigned_to`, `state`, `sys_created_on`
- Sort: **priority, then oldest first**. `requested_date_time` is a catalog variable and can't be
  sorted on in a list query; if Scott wants "soonest requested date first", add a `due_date`
  sync from that variable (small BR, same pattern as Story 2's priority sync).
- Empty state text: *"No active work orders for you or your team."*
- Row click → open record (`record` page, table `sc_task`, sysId from row).
- Header title: **Active Tasks** with a count badge (`@data.<resource>.output.count`).

## 4. Record page
The template's default record page works for `sc_task`. Check:
- **Variable Editor** shows Park variables; the 14 locked variables are read-only and **Urgency**
  is editable (Story 2 write roles).
- **Task SLAs** related list shows the 48 h OLA (needs Story 3's `task_sla` read ACL).
- Compose / work notes, Assigned to, State available in the form header.

### Trim related lists (Park-only view)
`sc_task`'s Workspace view is shared with SOW, so don't edit it. Run `04_fix_park_form_view.js`:
dry run lists the current related lists, then set `KEEP` and run for real. It creates view
`park_workspace` with the same form fields (inline variables) and only the kept related lists.

Point the Record page at it: UI Builder → Record page → **Data resources → Form Controller** →
**View** = `park_workspace`. (Alternative: *Workspace View Rules*, table `sc_task`, view
`park_workspace`, scoped to this experience.)

## 5. Lists and landing
Run in order:
1. `01_fix_create_list_menu.js` – 5 lists under a **Park Work Orders** category, visible to `park`.
2. `02_fix_module_and_landing.js` – nav module + sets home page to `/now/park-workspace/home` for users who
   have `park` but **not** `itil`/`admin` (they keep their own landing).
3. `03_br_park_landing_on_role_grant.js` – business rule so newly added PRK group members land in the workspace.

Workspaces menu: only experiences the user's roles allow appear, so non-Park users won't see it.

## Dependencies
- **Story 2** – locked variables + urgency write role (ran; output confirmed 14 locked + urgency).
- **Story 3** – SLA definition + `task_sla` read ACL (for "Past 48 hours" tile and SLA related list).
- **Story 4 security finding** – the `sc_task` read ACL `220bd7ff975802100ae037300153afd9` lets
  `park` read *every* catalog task. Workspace lists are filtered to Park WOs, but a user can edit
  a list filter and see other departments' tasks. Tighten that ACL before go-live.

## Acceptance tests
1. Impersonate a Park-only user (not Scott) → *Workspaces* shows **Park Trades Workspace**; logging in lands on `/now/park-workspace/home`.
2. Home page shows no "Access Restricted" tiles.
3. Tile counts match a classic `sc_task` list with the same condition.
4. Active Tasks lists the user's + group's open Park WOs, Emergency first; closing one removes it.
5. Click a task → record page; locked variables read-only, Urgency editable.
6. All 5 lists load; "Unassigned" shows only group tasks with no assignee.
7. ITIL user (no `park`) → workspace not in menu; direct URL `/now/park-workspace/home` is denied.
8. User with both `park` and `itil` → landing unchanged (still SOW / their own home).

## Open questions for Scott
1. Should supervisors also get a team view across **all** PRK groups, not just their own?
2. Sort Active Tasks by urgency, or by the requested date/time the requester entered?
3. Should the workspace replace the classic *Open Park Tasks / All Park Tasks* modules, or sit alongside?
