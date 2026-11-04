/**
 * Catalog Client Script: "PRK - Lock variables except Urgency after submission"
 *   Catalog item: Park & Rec Work Order
 *   Type: onLoad | UI Type: All
 *   Applies on a Catalog Item view: FALSE
 *   Applies on Requested Items: TRUE
 *   Applies on Catalog Tasks: TRUE
 *
 * UX layer only. Server enforcement is the Write roles set in 01_fix script.
 * Makes the form clearly show that Urgency is the one editable field.
 *
 * Use the same role as EDIT_ROLE in 01_fix ('park' or 'park_supervisor').
 */
function onLoad() {
    g_form.setVariablesReadOnly(true);
    if (g_user.hasRole('park')) {
        g_form.setReadOnly('urgency', false);
        g_form.showFieldMsg('urgency', 'You can change urgency. Save the task to apply it.', 'info');
    }
}
