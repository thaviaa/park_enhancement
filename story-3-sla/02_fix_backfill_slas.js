/**
 * Story 3 - Backfill the new SLA onto existing Park work orders so Story 4's
 * response-rate report has history from day one (not just tasks created after go-live).
 *
 * Uses the OOB SLA Repair API. Repair recalculates task_sla records from the task's
 * audit history, so stop times reflect when each task actually went to Work in Progress.
 *
 * Run in Test first and compare a few tasks by hand. Adjust the date range to taste;
 * a large range on PROD should be run after hours.
 */
(function () {
    var CAT_ITEM = '00860b96970c02500ae037300153afe8';
    var FROM = '2026-01-01 00:00:00';

    var q = 'request_item.cat_item=' + CAT_ITEM + '^sys_created_on>=' + FROM;
    var n = new GlideAggregate('sc_task');
    n.addEncodedQuery(q);
    n.addAggregate('COUNT');
    n.query();
    n.next();
    gs.info('[PRK S3] Repairing SLAs for ' + n.getAggregate('COUNT') + ' tasks');

    new SLARepair().repairByFilter(q, 'sc_task');
})();
