/**
 * Story 2 - One-time backfill: set priority on existing Park work orders from their urgency.
 * Needed so Story 4 reports can break down historical work orders by urgency.
 * Run AFTER the Script Include exists. Uses setWorkflow(false) so no notifications/SLAs fire
 * and autoSysFields(false) so "Updated" timestamps are not touched.
 */
(function () {
    var util = new ParkUrgencyUtil();
    var count = 0;
    var t = new GlideRecord('sc_task');
    t.addQuery('request_item.cat_item', util.CAT_ITEM);
    t.query();
    while (t.next()) {
        var pri = util.priorityFor(t.request_item.variables.urgency + '');
        if (t.getValue('priority') != pri) {
            t.setValue('priority', pri);
            t.setWorkflow(false);
            t.autoSysFields(false);
            t.update();
            count++;
        }
    }
    gs.info('[PRK S2] Backfilled priority on ' + count + ' Park work order tasks');
})();
