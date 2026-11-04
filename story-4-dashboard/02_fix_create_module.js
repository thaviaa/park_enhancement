/**
 * Story 4 - Add "Park Work Order Dashboard" module beside Open Park Tasks / All Park Tasks.
 * Build the dashboard first (see README), then paste its sys_id below and run.
 */
(function () {
    var DASHBOARD_ID = 'PASTE_DASHBOARD_SYS_ID';
    var APP_MENU = 'd128ead2c0a8016501c6bbd3f9c03678'; // Service Catalog menu (where the Park modules live)

    // Next Experience (Platform Analytics) dashboard URL.
    // For a classic responsive dashboard use: '$pa_dashboard.do?sysparm_dashboard=' + DASHBOARD_ID
    var URL = '/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/' + DASHBOARD_ID;

    var m = new GlideRecord('sys_app_module');
    var isNew = !m.get('title', 'Park Work Order Dashboard');
    if (isNew) m.initialize();
    m.setValue('title', 'Park Work Order Dashboard');
    m.setValue('application', APP_MENU);
    m.setValue('link_type', 'DIRECT');   // "URL (from Arguments)"
    m.setValue('query', URL);
    m.setValue('window_name', '_top');
    m.setValue('roles', 'park');
    m.setValue('active', true);

    // Order it just after the existing Park modules
    var p = new GlideRecord('sys_app_module');
    p.addQuery('application', APP_MENU);
    p.addQuery('title', 'All Park Tasks');
    p.query();
    if (p.next()) m.setValue('order', parseInt(p.getValue('order') || 100, 10) + 1);

    isNew ? m.insert() : m.update();
    gs.info('[PRK S4] Module ' + (isNew ? 'created' : 'updated'));
})();
