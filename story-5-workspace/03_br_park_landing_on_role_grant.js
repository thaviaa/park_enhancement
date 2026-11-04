/**
 * Business Rule: PRK S5 - Park workspace landing on role grant
 * Table: sys_user_has_role  |  When: after insert  |  Advanced: true
 * Condition: current.role.name == 'park'
 *
 * Someone added to a PRK group inherits park via the group. Point their home page at the
 * Park Trades Workspace unless they also hold itil/admin, and never overwrite a landing
 * page the user already chose.
 */
(function executeRule(current, previous /*null when async*/) {
    var WS_URL = '/now/park-workspace/home';
    var PREF = 'my_home_navigation_page';
    var uid = current.getValue('user');

    var other = new GlideRecord('sys_user_has_role');
    other.addQuery('user', uid);
    other.addQuery('role.name', 'IN', 'itil,admin');
    other.setLimit(1);
    other.query();
    if (other.hasNext()) return;

    var p = new GlideRecord('sys_user_preference');
    p.addQuery('user', uid);
    p.addQuery('name', PREF);
    p.query();
    if (p.hasNext()) return; // respect an existing choice

    p.initialize();
    p.setValue('user', uid);
    p.setValue('name', PREF);
    p.setValue('value', WS_URL);
    p.setValue('type', 'string');
    p.insert();
    gs.info('[PRK S5] Landing set to Park workspace for ' + current.user.getDisplayValue());
})(current, previous);
