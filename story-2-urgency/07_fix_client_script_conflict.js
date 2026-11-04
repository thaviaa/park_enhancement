/**
 * Story 2 - Fix Urgency read-only on SCTASK (found by 06_diag in Sandbox)
 * Run as: Fix Script with update set "PRK Enhancements - Story 2 Urgency". Idempotent.
 *
 * Diagnosis (mecknsandbox, 11/4/2026):
 *   - "PRK - Lock variables except Urgency after submission" (9eed44e687989f10b09aa8a73cbb358c)
 *     had type = empty, so it never ran and never re-enabled Urgency.
 *   - Pre-existing "set variables read only" (fa9128fa976c0e100ae037300153afac), onLoad,
 *     applies on Catalog Tasks, calls setVariablesReadOnly(true) with no Urgency exception.
 *
 * Fix:
 *   1. Set the Story 2 script to onLoad (UI Type All, RITM + SCTASK, not on order form).
 *   2. Deactivate the old script. Story 2's script does the same lock plus the Urgency
 *      exception, so nothing is lost. Deactivated (not deleted) so it can be restored.
 */
(function () {
    var STORY2_CS = '9eed44e687989f10b09aa8a73cbb358c';
    var LEGACY_CS = 'fa9128fa976c0e100ae037300153afac';

    var s2 = new GlideRecord('catalog_script_client');
    if (s2.get(STORY2_CS)) {
        s2.setValue('type', 'onLoad');
        s2.setValue('ui_type', '10');          // All
        s2.setValue('applies_catalog', false); // not on the order form
        s2.setValue('applies_req_item', true);
        s2.setValue('applies_sc_task', true);
        s2.setValue('active', true);
        s2.update();
        gs.info('[PRK S2] Story 2 client script set to onLoad');
    } else {
        gs.error('[PRK S2] Story 2 client script ' + STORY2_CS + ' not found');
    }

    var old = new GlideRecord('catalog_script_client');
    if (old.get(LEGACY_CS)) {
        if (old.getValue('active') == '1') {
            old.setValue('active', false);
            old.update();
            gs.info('[PRK S2] Deactivated legacy "' + old.getValue('name') + '"');
        } else {
            gs.info('[PRK S2] Legacy script already inactive');
        }
    } else {
        gs.info('[PRK S2] Legacy script ' + LEGACY_CS + ' not found (nothing to do)');
    }
})();
