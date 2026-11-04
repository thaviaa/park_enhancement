/**
 * Story 2 - Default Urgency to One Week + restrict who can edit it after submission
 * Run as: Fix Script (or Scripts - Background) with the story's update set selected.
 * Idempotent: safe to run more than once.
 *
 * What it does
 *   1. Sets the Urgency variable default to "one_week".
 *   2. Sets Write roles on Urgency to the role allowed to change it after submission.
 *   3. Sets Write roles on every OTHER variable to a role Park users do not have,
 *      so Park users can change Urgency but nothing else on the submitted request.
 *
 * Note: Write roles apply to the submitted RITM/SCTASK only. The order form is governed
 * by Create roles, so requesters can still fill in every variable when submitting.
 *
 * Decide EDIT_ROLE before running (open question to Scott):
 *   'park'            -> every Park user can change urgency
 *   'park_supervisor' -> create that role first, grant it to Scott/supervisors only
 */
(function () {
    var CAT_ITEM = '00860b96970c02500ae037300153afe8'; // Park & Rec Work Order
    var EDIT_ROLE = 'park';
    var LOCK_ROLE = 'catalog_admin'; // who may still edit the other variables after submission

    var v = new GlideRecord('item_option_new');
    v.addQuery('cat_item', CAT_ITEM);
    v.addQuery('type', 'NOT IN', '19,20,24'); // skip container start/end/split
    v.query();
    while (v.next()) {
        if (v.getValue('name') == 'urgency') {
            v.setValue('default_value', 'one_week');
            v.setValue('write_roles', EDIT_ROLE);
            gs.info('[PRK S2] urgency: default=one_week, write_roles=' + EDIT_ROLE);
        } else {
            // Only lock variables that are not already restricted
            if (!v.getValue('write_roles')) {
                v.setValue('write_roles', LOCK_ROLE);
                gs.info('[PRK S2] locked variable ' + v.getValue('name'));
            }
        }
        v.update();
    }
})();
