/**
 * Catalog Client Script: "PRK - Lock variables except Urgency after submission"
 *   Catalog item: Park & Rec Work Order
 *   Type: onLoad | UI Type: All
 *   Applies on a Catalog Item view: FALSE
 *   Applies on Requested Items: TRUE
 *   Applies on Catalog Tasks: TRUE
 *
 * UX layer only. The Write roles set in 01_fix do the locking: variables with
 * write_roles=catalog_admin render read-only, Urgency (write_roles=park) stays editable.
 *
 * Do NOT call g_form.setVariablesReadOnly(true) here. In the variable editor the bulk
 * lock wins over a later setReadOnly('urgency', false), leaving Urgency locked
 * (seen in Sandbox 11/4/2026).
 *
 * Use the same role as EDIT_ROLE in 01_fix ('park' or 'park_supervisor').
 */
function onLoad() {
    if (g_user.hasRole('park')) {
        g_form.showFieldMsg('urgency', 'You can change urgency. Save the task to apply it.', 'info');
    }
}
