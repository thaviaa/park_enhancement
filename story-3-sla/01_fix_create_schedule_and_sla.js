/**
 * Story 3 - 48-business-hour response SLA for Park & Rec Work Orders
 * Run as: Fix Script with update set "PRK Enhancements - Story 3 SLA" selected. Idempotent.
 *
 * KEY DESIGN DECISION - schedule shape
 *   Scott: "48 hours less weekends". With an SLA, the duration is counted only in
 *   schedule time, so:
 *     24x5 schedule (Mon 00:00 - Fri 23:59) + 48h  -> Fri 3 PM submit is due Tue 3 PM   (matches the ask)
 *     8-5 schedule  (9 h/day)            + 48h  -> due ~5.3 business days later      (NOT what he means)
 *   So this script builds a 24x5 schedule. If Scott wants 8-5 hours, set
 *   USE_8_TO_5 = true; the duration becomes 18h (= 2 business days of 9 h).
 */
(function () {
    var CAT_ITEM = '00860b96970c02500ae037300153afe8';
    var USE_8_TO_5 = false;
    var TZ = 'US/Eastern';

    // ---------- 1. Schedule ----------
    var schedName = USE_8_TO_5 ? 'PRK Trades Mon-Fri 8-5' : 'PRK Trades Mon-Fri 24x5';
    var sched = new GlideRecord('cmn_schedule');
    if (!sched.get('name', schedName)) {
        sched.initialize();
        sched.setValue('name', schedName);
        sched.setValue('time_zone', TZ);
        sched.setValue('description', 'Park & Rec trades working week - used by Park work order SLA');
        sched.insert();

        var span = new GlideRecord('cmn_schedule_span');
        span.initialize();
        span.setValue('schedule', sched.getUniqueValue());
        span.setValue('name', 'Weekdays');
        span.setValue('repeat_type', 'weekly');
        span.setValue('repeat_count', 1);
        span.setValue('days_of_week', '12345'); // Mon-Fri
        if (USE_8_TO_5) {
            span.setValue('start_date_time', '20260105T080000');
            span.setValue('end_date_time', '20260105T170000');
        } else {
            span.setValue('all_day', true);
            span.setValue('start_date_time', '20260105T000000');
            span.setValue('end_date_time', '20260105T235959');
        }
        span.insert();
        gs.info('[PRK S3] Created schedule ' + schedName);
    }
    // Holidays: if the county has a holiday schedule, add it on the schedule's
    // "Child Schedules" related list with type = Excluded (do this in the UI).

    // ---------- 2. SLA definition ----------
    var slaName = 'PRK Work Order - 48 Business Hour Response';
    var sla = new GlideRecord('contract_sla');
    var isNew = !sla.get('name', slaName);
    if (isNew) sla.initialize();

    sla.setValue('name', slaName);
    sla.setValue('type', 'OLA');          // internal team target; change to 'SLA' if you report OLAs separately
    sla.setValue('target', 'response');
    sla.setValue('collection', 'sc_task');
    sla.setValue('schedule_source', 'sla_definition');
    sla.setValue('schedule', sched.getUniqueValue());
    sla.setValue('timezone_source', 'sla_definition');
    sla.setValue('timezone', TZ);
    sla.duration.setDateNumericValue((USE_8_TO_5 ? 18 : 48) * 3600 * 1000);

    // Start: any Park work order task
    sla.setValue('start_condition', 'request_item.cat_item=' + CAT_ITEM);
    sla.setValue('retroactive', true);           // measure from task creation, not attach time
    sla.setValue('set_start_to', 'sys_created_on');

    // Stop = "responded". DEFAULT: tech moves task to Work in Progress (or closes it).
    // Alternatives (pending Scott's answer) - swap the encoded query:
    //   Assigned to a technician: 'assigned_toISNOTEMPTY'   (bad if assignment rules auto-assign on insert)
    //   First work note:          'u_first_response_onISNOTEMPTY' (needs 03_optional_first_response_br.js)
    sla.setValue('stop_condition', 'stateIN2,3');
    sla.setValue('when_to_cancel', 'on_condition');
    sla.setValue('cancel_condition', 'stateIN4,7'); // Closed Incomplete / Closed Skipped
    sla.setValue('active', true);

    if (isNew) sla.insert(); else sla.update();
    gs.info('[PRK S3] ' + (isNew ? 'Created' : 'Updated') + ' SLA ' + slaName + ' (' + sla.getUniqueValue() + ')');
})();
