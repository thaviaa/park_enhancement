/**
 * Story 2 - Diagnose why Urgency is read-only on SCTASK for a park user
 * Run as: Scripts - Background (read-only, changes nothing).
 *
 * Symptom (sandbox, SCTASK0082356): every variable read-only, including Urgency,
 * while impersonating a park user. Fix script 01 only sets Write roles, so anything
 * else forcing read-only shows up here.
 *
 * Optional: set TEST_USER to the impersonated user's user_name to check their roles.
 */
(function () {
    var CAT_ITEM = '00860b96970c02500ae037300153afe8';
    var TEST_USER = ''; // user_name or sys_id

    // 1. The urgency variable itself
    var v = new GlideRecord('item_option_new');
    v.addQuery('cat_item', CAT_ITEM);
    v.addQuery('name', 'urgency');
    v.query();
    if (!v.next()) { gs.info('[PRK S2 DIAG] urgency variable NOT found on item'); return; }
    var urgId = v.getUniqueValue();
    gs.info('[PRK S2 DIAG] urgency ' + urgId +
        ' | read_only=' + v.getValue('read_only') +
        ' | write_roles=' + v.getValue('write_roles') +
        ' | read_roles=' + v.getValue('read_roles') +
        ' | default=' + v.getValue('default_value'));

    // 2. Catalog UI policies that apply on Catalog Tasks (item-level and variable-set level)
    var vsets = [];
    var vs = new GlideRecord('io_set_item');
    vs.addQuery('sc_cat_item', CAT_ITEM);
    vs.query();
    while (vs.next()) vsets.push(vs.getValue('variable_set'));

    var pol = new GlideRecord('catalog_ui_policy');
    pol.addActiveQuery();
    pol.addQuery('applies_sc_task', true);
    var q = pol.addQuery('catalog_item', CAT_ITEM);
    if (vsets.length) q.addOrCondition('variable_set', 'IN', vsets.join(','));
    pol.query();
    while (pol.next()) {
        var acts = [];
        var a = new GlideRecord('catalog_ui_policy_action');
        a.addQuery('ui_policy', pol.getUniqueValue());
        a.addQuery('disabled', 'true'); // "Read only = True"
        a.query();
        while (a.next()) acts.push(a.catalog_variable.getDisplayValue() || a.getValue('catalog_variable'));
        gs.info('[PRK S2 DIAG] UI policy "' + pol.getValue('short_description') + '" ' + pol.getUniqueValue() +
            ' | condition=' + pol.getValue('catalog_conditions') +
            ' | read-only actions: ' + (acts.join(', ') || 'none'));
    }

    // 3. Catalog client scripts that apply on Catalog Tasks
    var cs = new GlideRecord('catalog_script_client');
    cs.addActiveQuery();
    cs.addQuery('applies_sc_task', true);
    var q2 = cs.addQuery('cat_item', CAT_ITEM);
    if (vsets.length) q2.addOrCondition('variable_set', 'IN', vsets.join(','));
    cs.query();
    while (cs.next()) {
        var s = cs.getValue('script') || '';
        var hits = [];
        if (s.indexOf('setVariablesReadOnly') > -1) hits.push('setVariablesReadOnly');
        if (/setReadOnly\(\s*['"]urgency/.test(s)) hits.push('setReadOnly(urgency)');
        if (/setDisabled|setReadonly/.test(s)) hits.push('setDisabled/setReadonly');
        gs.info('[PRK S2 DIAG] Client script "' + cs.getValue('name') + '" ' + cs.getUniqueValue() +
            ' | type=' + cs.getValue('type') + ' | ' + (hits.join(', ') || 'no read-only calls'));
    }

    // 4. Impersonated user's roles
    if (TEST_USER) {
        var u = new GlideRecord('sys_user');
        if (u.get(TEST_USER) || u.get('user_name', TEST_USER)) {
            var roles = [];
            var r = new GlideRecord('sys_user_has_role');
            r.addQuery('user', u.getUniqueValue());
            r.addQuery('role.name', 'IN', 'park,itil,admin,catalog_admin,sn_request_write,task_editor');
            r.query();
            while (r.next()) roles.push(r.role.name.toString());
            gs.info('[PRK S2 DIAG] ' + u.getValue('user_name') + ' roles: ' + (roles.join(', ') || 'none of the checked roles'));
        } else {
            gs.info('[PRK S2 DIAG] user ' + TEST_USER + ' not found');
        }
    }
})();
