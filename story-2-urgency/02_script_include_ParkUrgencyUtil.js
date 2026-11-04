/**
 * Script Include: ParkUrgencyUtil
 * Client callable: false | Accessible from: All application scopes
 *
 * Maps the Park & Rec Work Order "urgency" variable to task.priority so that
 *   - list views can sort/group by priority,
 *   - reports (Story 4) can break down by urgency without querying variables,
 *   - SLAs (Story 3) can use per-urgency targets if Scott wants them.
 */
var ParkUrgencyUtil = Class.create();
ParkUrgencyUtil.prototype = {
    initialize: function () {},

    CAT_ITEM: '00860b96970c02500ae037300153afe8',

    // urgency value -> task.priority (1 Critical, 2 High, 3 Moderate, 4 Low)
    MAP: {
        emergency: '1',
        one_day: '2',
        one_week: '3',
        one_month: '4'
    },

    priorityFor: function (urgency) {
        return this.MAP[urgency] || '3'; // default One Week -> Moderate
    },

    /** Push the RITM's current urgency down to the RITM and all its catalog tasks. */
    syncFromRitm: function (ritmId, changedBy) {
        var ritm = new GlideRecord('sc_req_item');
        if (!ritm.get(ritmId) || ritm.getValue('cat_item') != this.CAT_ITEM)
            return;

        var urgency = ritm.variables.urgency + '';
        var pri = this.priorityFor(urgency);

        if (ritm.getValue('priority') != pri) {
            ritm.setValue('priority', pri);
            ritm.update();
        }

        var t = new GlideRecord('sc_task');
        t.addQuery('request_item', ritmId);
        t.addActiveQuery();
        t.query();
        while (t.next()) {
            if (t.getValue('priority') == pri)
                continue;
            t.setValue('priority', pri);
            if (changedBy)
                t.work_notes = 'Urgency changed to ' + ritm.variables.urgency.getDisplayValue() +
                    ' by ' + changedBy + '.';
            t.update();
        }
    },

    type: 'ParkUrgencyUtil'
};
