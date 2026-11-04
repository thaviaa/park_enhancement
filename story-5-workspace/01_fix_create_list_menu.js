/**
 * Story 5 - Park Trades Workspace list menu
 * Run as: Fix Script with update set "PRK Enhancements - Story 5 Workspace". Idempotent (matches on title).
 *
 * Create the experience in UI Builder first (URL path park-workspace, Workspace App Shell).
 * No sys_id to paste: the script finds the experience by URL path, creates the List Menu
 * Configuration if the experience doesn't have one, and links it via the app config's
 * "listConfigId" page property (the property workspace shells read for their list menu).
 *
 * Creates:
 *   sys_ux_list_menu_config     "Park Workspace List Menu" (if missing)
 *   sys_ux_page_property        listConfigId on the experience -> that config
 *   sys_ux_applicability        "Park users" (role park)
 *   sys_ux_list_category        "Park Work Orders"
 *   sys_ux_list x5              My Tasks, My Group's Tasks, Unassigned, All Open, Recently Closed
 *   sys_ux_applicability_m2m_list  links each list to the applicability
 */
(function () {
    var WS_PATH = 'park-workspace';
    var CAT_ITEM = '00860b96970c02500ae037300153afe8'; // Park & Rec Work Order
    var PARK = 'request_item.cat_item=' + CAT_ITEM;
    var ME = 'assigned_toDYNAMIC90d1921e5f510100a9ad2572f2b477fe';        // "Me"
    var MYGR = 'assignment_groupDYNAMICd6435e965f510100a9ad2572f2b47744'; // "One of My Groups"
    var COLS = 'number,short_description,priority,state,assignment_group,assigned_to,sys_created_on';

    // 0. Find the experience and its list menu config
    var exp = new GlideRecord('sys_ux_page_registry');
    if (!exp.get('path', WS_PATH)) {
        gs.error('[PRK S5] No experience with URL path "' + WS_PATH + '" - create it in UI Builder first');
        return;
    }
    gs.info('[PRK S5] Experience "' + exp.getValue('title') + '" -> ' + exp.getUniqueValue());

    var prop = new GlideRecord('sys_ux_page_property');
    prop.addQuery('page', exp.getUniqueValue());
    prop.addQuery('name', 'listConfigId');
    prop.query();
    var hasProp = prop.next();
    var LIST_MENU_CONFIG = hasProp ? prop.getValue('value') : '';

    var cfg = new GlideRecord('sys_ux_list_menu_config');
    if (!LIST_MENU_CONFIG || !cfg.get(LIST_MENU_CONFIG)) {
        LIST_MENU_CONFIG = upsert('sys_ux_list_menu_config', 'name', 'Park Workspace List Menu', {
            description: 'List menu for the Park workspace (Story 5)',
            active: true
        });
    }
    if (!hasProp) {
        prop.initialize();
        prop.setValue('page', exp.getUniqueValue());
        prop.setValue('name', 'listConfigId');
        prop.setValue('type', 'string');
    }
    prop.setValue('value', LIST_MENU_CONFIG);
    hasProp ? prop.update() : prop.insert();
    gs.info('[PRK S5] listConfigId -> ' + LIST_MENU_CONFIG);

    // 1. Applicability: park role
    var app = upsert('sys_ux_applicability', 'name', 'Park users', {
        roles: 'park',
        active: true
    });

    // 2. Category
    var cat = upsert('sys_ux_list_category', 'title', 'Park Work Orders', {
        configuration: LIST_MENU_CONFIG,
        order: 100,
        active: true
    });

    // 3. Lists
    var lists = [
        { title: 'My Tasks',          cond: PARK + '^active=true^' + ME },
        { title: "My Group's Tasks",  cond: PARK + '^active=true^' + MYGR },
        { title: 'Unassigned',        cond: PARK + '^active=true^' + MYGR + '^assigned_toISEMPTY' },
        { title: 'All Open',          cond: PARK + '^active=true' },
        { title: 'Recently Closed',   cond: PARK + '^active=false^closed_atRELATIVEGT@dayofweek@ago@30' }
    ];

    lists.forEach(function (l, i) {
        var listId = upsert('sys_ux_list', 'title', l.title, {
            configuration: LIST_MENU_CONFIG,
            category: cat,
            table: 'sc_task',
            condition: l.cond + '^ORDERBYpriority^ORDERBYsys_created_on',
            columns: COLS,
            order: (i + 1) * 100,
            active: true
        }, { category: cat });

        // 4. Link list -> applicability
        var m2m = new GlideRecord('sys_ux_applicability_m2m_list');
        m2m.addQuery('list', listId);
        m2m.addQuery('applicability', app);
        m2m.query();
        if (!m2m.hasNext()) {
            m2m.initialize();
            m2m.setValue('list', listId);
            m2m.setValue('applicability', app);
            m2m.setValue('order', 100);
            m2m.insert();
        }
    });

    gs.info('[PRK S5] List menu ready: category ' + cat + ', ' + lists.length + ' lists');

    // ---- helpers ----
    function upsert(table, keyField, keyValue, values, extraKeys) {
        var gr = new GlideRecord(table);
        gr.addQuery(keyField, keyValue);
        if (extraKeys) for (var k in extraKeys) gr.addQuery(k, extraKeys[k]);
        gr.query();
        var isNew = !gr.next();
        if (isNew) {
            gr.initialize();
            gr.setValue(keyField, keyValue);
        }
        for (var f in values) gr.setValue(f, values[f]);
        var id = isNew ? gr.insert() : (gr.update(), gr.getUniqueValue());
        gs.info('[PRK S5] ' + (isNew ? 'Created ' : 'Updated ') + table + ' "' + keyValue + '" -> ' + id);
        return id;
    }
})();
