/**
 * ACLs: let Park users write the Urgency answer on Park work orders (and nothing else)
 * Create both in the "PRK Enhancements - Story 2 Urgency" update set (elevate to security_admin).
 *
 * Why: the variable editor needs write on sc_item_option, not just the variable's Write roles.
 * OOB sc_item_option write ACLs require itil/catalog_admin, so Park users (park,
 * sn_request_write, task_editor) see Urgency read-only.
 * Confirmed in Sandbox 11/4/2026 as Scott Hyatt on REQ0052968:
 *   canRead=true canWrite=false value.canWrite=false
 *
 * ---------------------------------------------------------------
 * ACL 1
 *   Type: record | Operation: write | Name: sc_item_option  (field: -- None --)
 *   Requires role: park | Advanced: true | Script: below
 *
 * ACL 2
 *   Type: record | Operation: write | Name: sc_item_option.value
 *   Requires role: park | Advanced: true | Script: below (same)
 * ---------------------------------------------------------------
 *
 * Scoped to the urgency variable on the Park & Rec Work Order item, so the other
 * 14 Park variables (and every other catalog item's answers) stay locked for Park users.
 */
answer = current.item_option_new.name == 'urgency' &&
         current.item_option_new.cat_item == '00860b96970c02500ae037300153afe8';

/*
 * Verify after creating: rerun the impersonation check. Expected:
 *   canRead=true canWrite=true value.canWrite=true
 * Then on SCTASK0082356 as Scott: Urgency is a working dropdown, the other 14 stay read-only,
 * save with One Month -> priority 4 on task + RITM, work note added.
 * Repeat with a park-only user (no Scott extras) to confirm the task itself saves.
 */
