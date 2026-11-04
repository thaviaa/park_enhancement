/**
 * ACL: task_sla  |  Operation: read  |  Type: record
 * Requires role: park
 * Advanced: true
 *
 * Park users need to read task_sla for the Story 4 response-rate report and to see
 * the SLA related list on their tasks. OOB task_sla read is limited to ITIL/SLA roles.
 * Scope it to Park work order SLAs only.
 *
 * Also create a matching field ACL "task_sla.*" read with the same role/script if your
 * instance has field-level ACLs on task_sla that deny by default.
 */
answer = (current.task.sys_class_name == 'sc_task' &&
          current.task.ref_sc_task.request_item.cat_item == '00860b96970c02500ae037300153afe8');
