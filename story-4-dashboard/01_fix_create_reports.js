/**
 * Story 4 - Park Work Order reports
 * Run as: Fix Script with update set "PRK Enhancements - Story 4 Dashboard". Idempotent (matches on title).
 *
 * Reports carry NO date condition on purpose - the dashboard's interactive date filter
 * supplies the time frame Scott picks. Each is shared to the park role.
 *
 * Run Story 3's 01 script first (report R5 needs the SLA definition).
 */
(function () {
    var CAT_ITEM = '00860b96970c02500ae037300153afe8';
    var PARK_WO = 'request_item.cat_item=' + CAT_ITEM;
    var ROLE = 'park';

    var slaDef = new GlideRecord('contract_sla');
    slaDef.get('name', 'PRK Work Order - 48 Business Hour Response');

    var reports = [
        {   // Ask #3 - submitted volume
            title: 'PRK WO - Submitted',
            table: 'sc_task', type: 'single_score',
            filter: PARK_WO
        },
        {   // Ask #3 - submitted by team, stacked by urgency (priority synced in Story 2)
            title: 'PRK WO - Submitted by Team and Urgency',
            table: 'sc_task', type: 'bar',
            field: 'assignment_group', stack_field: 'priority',
            filter: PARK_WO
        },
        {   // Ask #1 - of the work orders submitted in the period, how many are completed
            title: 'PRK WO - Submitted vs Completed by Team',
            table: 'sc_task', type: 'bar',
            field: 'assignment_group', stack_field: 'state',
            filter: PARK_WO
        },
        {   // Ask #1 - trend view of the same
            title: 'PRK WO - Submitted vs Completed by Week',
            table: 'sc_task', type: 'trend',
            trend_field: 'sys_created_on', interval: 'week', field: 'state',
            filter: PARK_WO
        },
        {   // Ask #2 - % responded within 48 business hours (Met vs Breached)
            title: 'PRK WO - 48 Hour Response (Met vs Breached)',
            table: 'task_sla', type: 'donut',
            field: 'has_breached',
            // exclude cancelled; include in-progress only once already breached
            filter: 'sla=' + slaDef.getUniqueValue() +
                '^stage!=cancelled^stage!=in_progress^ORhas_breached=true'
        },
        {   // Ask #2 - per-team response performance
            title: 'PRK WO - 48 Hour Response by Team',
            table: 'task_sla', type: 'bar',
            field: 'task.assignment_group', stack_field: 'has_breached',
            filter: 'sla=' + slaDef.getUniqueValue() +
                '^stage!=cancelled^stage!=in_progress^ORhas_breached=true'
        },
        {   // Operational - open work orders already past 48 business hours
            title: 'PRK WO - Open and Past 48 Hours',
            table: 'task_sla', type: 'list',
            filter: 'sla=' + slaDef.getUniqueValue() + '^stage=in_progress^has_breached=true',
            column_list: 'task,task.assignment_group,task.assigned_to,start_time,business_elapsed_time'
        }
    ];

    reports.forEach(function (r) {
        var gr = new GlideRecord('sys_report');
        var isNew = !gr.get('title', r.title);
        if (isNew) gr.initialize();
        gr.setValue('title', r.title);
        gr.setValue('table', r.table);
        gr.setValue('type', r.type);
        gr.setValue('filter', r.filter);
        gr.setValue('aggregate', 'COUNT');
        gr.setValue('is_published', false);
        gr.setValue('roles', ROLE);
        ['field', 'stack_field', 'trend_field', 'interval', 'column_list'].forEach(function (f) {
            if (r[f]) gr.setValue(f, r[f]);
        });
        var id = isNew ? gr.insert() : (gr.update(), gr.getUniqueValue());
        gs.info('[PRK S4] ' + (isNew ? 'Created ' : 'Updated ') + r.title + ' -> ' + id);
    });
})();
