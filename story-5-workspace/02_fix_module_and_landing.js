/**
 * Story 5 - Nav module + default landing page for Park-only users
 * Run as: Fix Script with update set "PRK Enhancements - Story 5 Workspace". Idempotent.
 *
 * 1. Adds a "Park Trades Workspace" module beside Open Park Tasks / All Park Tasks.
 * 2. Sets the Next Experience home page preference to the workspace for users who have
 *    park but NOT itil/admin (mixed-role users keep their current landing).
 *
 * Note: user preferences are data, not captured in update sets. Re-run this script in
 * each instance after the update set is committed.
 */
(function () {
    var WS_URL = '/now/park/home';
    var APP_MENU = 'd128ead2c0a8016501c6bbd3f9c03678'; // Service Catalog menu (where the Park modules live)
    var SKIP_ROLES = ['itil', 'admin'];
    var PREF = 'my_home_navigation_page';              // Next Experience "Home" landing preference

    // 1. Module
    var m = new GlideRecord('sys_app_module');
    var isNew = !m.get('title', 'Park Trades Workspace');
    if (isNew) m.initialize();
    m.setValue('title', 'Park Trades Workspace');
    m.setValue('application', APP_MENU);
    m.setValue('link_type', 'DIRECT');
    m.setValue('query', WS_URL);
    m.setValue('window_name', '_top');
    m.setValue('roles', 'park');
    m.setValue('active', true);
    m.setValue('order', 50); // above the classic Park modules
    isNew ? m.insert() : m.update();
    gs.info('[PRK S5] Module ' + (isNew ? 'created' : 'updated'));

    // 2. Landing preference for Park-only users
    var set = 0, skipped = 0;
    var seen = {};
    var ur = new GlideRecord('sys_user_has_role');
    ur.addQuery('role.name', 'park');
    ur.addQuery('user.active', true);
    ur.query();
    while (ur.next()) {
        var uid = ur.getValue('user');
        if (seen[uid]) continue;
        seen[uid] = true;

        if (hasAnyRole(uid, SKIP_ROLES)) { skipped++; continue; }

        var p = new GlideRecord('sys_user_preference');
        p.addQuery('user', uid);
        p.addQuery('name', PREF);
        p.query();
        if (p.next()) {
            if (p.getValue('value') == WS_URL) continue;
            p.setValue('value', WS_URL);
            p.update();
        } else {
            p.initialize();
            p.setValue('user', uid);
            p.setValue('name', PREF);
            p.setValue('value', WS_URL);
            p.setValue('type', 'string');
            p.insert();
        }
        set++;
    }
    gs.info('[PRK S5] Landing set for ' + set + ' Park-only users; skipped ' + skipped + ' with ' + SKIP_ROLES.join('/'));

    function hasAnyRole(uid, roles) {
        var r = new GlideRecord('sys_user_has_role');
        r.addQuery('user', uid);
        r.addQuery('role.name', 'IN', roles.join(','));
        r.setLimit(1);
        r.query();
        return r.hasNext();
    }
})();
