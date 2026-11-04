/* =====================================================================
 * Business Rule 1: "PRK - Set priority from urgency on task insert"
 *   Table: sc_task | When: before | Insert: true
 *   Condition: current.request_item.cat_item == '00860b96970c02500ae037300153afe8'
 * ===================================================================== */
(function executeRule(current, previous) {
    var urgency = current.request_item.variables.urgency + '';
    current.setValue('priority', new ParkUrgencyUtil().priorityFor(urgency));
})(current, previous);


/* =====================================================================
 * Business Rule 2: "PRK - Sync priority when urgency variable changes"
 *   Table: sc_item_option | When: after | Update: true
 *   Condition (filter): Value changes
 *   Advanced condition:
 *     current.item_option_new.name == 'urgency' &&
 *     current.item_option_new.cat_item == '00860b96970c02500ae037300153afe8'
 *
 * Fires no matter where the variable was edited (RITM form, SCTASK form,
 * workspace variable editor), so it is the server-side source of truth.
 * ===================================================================== */
(function executeRule(current, previous) {
    var m = new GlideRecord('sc_item_option_mtom');
    m.addQuery('sc_item_option', current.getUniqueValue());
    m.setLimit(1);
    m.query();
    if (m.next())
        new ParkUrgencyUtil().syncFromRitm(m.getValue('request_item'), gs.getUserDisplayName());
})(current, previous);


/* =====================================================================
 * Business Rule 3 (optional): "PRK - Sync urgency when priority edited on task"
 *   Use ONLY if you would rather let Park users change task.priority directly
 *   (e.g. from a list edit) instead of the variable. Pick one approach -
 *   enabling both is fine, but keep Rule 2's update from re-triggering this
 *   (it won't: Rule 2 updates sc_task.priority, this writes the variable only
 *   when they differ).
 *   Table: sc_task | When: after | Update: true
 *   Condition: Priority changes AND request_item.cat_item is Park & Rec Work Order
 * ===================================================================== */
(function executeRule(current, previous) {
    var REVERSE = { '1': 'emergency', '2': 'one_day', '3': 'one_week', '4': 'one_month' };
    var want = REVERSE[current.getValue('priority')];
    var ritm = current.request_item.getRefRecord();
    if (want && ritm.isValidRecord() && ritm.variables.urgency + '' != want) {
        ritm.variables.urgency = want;
        ritm.update(); // fires Rule 2 via sc_item_option -> syncs sibling tasks
    }
})(current, previous);
