/**
 * Story 5 - Park form view for sc_task (trim related lists without touching SOW)
 * Run as: Scripts - Background / Fix Script, update set "PRK Enhancements - Story 5 Workspace".
 * Idempotent.
 *
 * The Record page shows sc_task's Workspace view, shared with Service Operations Workspace,
 * so it carries ITSM/HAM tabs (CIs, Approvers, Group approvals, Transfer Orders, Asset
 * Reclamation Requests). This creates a separate view "park_workspace":
 *   1. Copies the form sections + fields from SOURCE_VIEW (keeps inline Park variables).
 *   2. Copies only the related lists named in KEEP.
 *
 * Step 1: run with DRY_RUN = true -> logs the source view's related lists (copy names from it).
 * Step 2: set KEEP, DRY_RUN = false, run again.
 * Step 3: point the Record page at the view (README §4).
 */
(function () {
    var DRY_RUN = false;
    var TABLE = 'sc_task';
    var SOURCE_VIEW = 'workspace';          // related lists came from here
    // Form fields: the Record page was actually rendering the Default view form
    // (Number, Request, Approval, Assignment group, Assigned to, ...). 'workspace' view has a
    // different section (CI, Active, ...). Copy fields from Default view.
    var FORM_SOURCE_VIEW = 'Default view';  // sys_id of the Default view
    var RESET_FORM = true;                  // true = replace park_workspace sections with a fresh copy
    var VIEW_NAME = 'park_workspace';
    var VIEW_TITLE = 'Park Workspace';
    // Related lists to keep, in display order. Empty = no related list tabs (decided 11/4/2026).
    // Source view had: task_ci.task, sysapproval_approver.sysapproval, sysapproval_group.parent,
    // REL:35e23f2a873303002ae97e2526cb0b1e. Add 'task_sla.task' here to show the Story 3 OLA tab.
    var KEEP = [];

    var src = getView(SOURCE_VIEW);
    if (!src) { gs.error('[PRK S5] Source view "' + SOURCE_VIEW + '" not found'); return; }

    // ---- show what the source view has ----
    var srl = new GlideRecord('sys_ui_related_list');
    srl.addQuery('name', TABLE);
    srl.addQuery('view', src);
    srl.query();
    var srcListId = srl.next() ? srl.getUniqueValue() : null;
    if (srcListId) {
        var e = new GlideRecord('sys_ui_related_list_entry');
        e.addQuery('list_id', srcListId);
        e.orderBy('position');
        e.query();
        while (e.next())
            gs.info('[PRK S5] ' + SOURCE_VIEW + ' related list: ' + e.getValue('related_list') +
                (KEEP.indexOf(e.getValue('related_list')) > -1 ? '   <- KEEP' : ''));
    } else {
        gs.info('[PRK S5] ' + SOURCE_VIEW + ' view has no related list config for ' + TABLE);
    }
    if (DRY_RUN) { gs.info('[PRK S5] DRY RUN - nothing changed. Set KEEP and DRY_RUN=false.'); return; }

    // ---- 1. view ----
    var view = getView(VIEW_NAME);
    if (!view) {
        var v = new GlideRecord('sys_ui_view');
        v.initialize();
        v.setValue('name', VIEW_NAME);
        v.setValue('title', VIEW_TITLE);
        view = v.insert();
        gs.info('[PRK S5] Created view ' + VIEW_NAME + ' -> ' + view);
    }

    // ---- 2. form sections + elements ----
    var formSrc = FORM_SOURCE_VIEW == 'Default view' ? 'Default view' : getView(FORM_SOURCE_VIEW);
    var have = new GlideRecord('sys_ui_section');
    have.addQuery('name', TABLE);
    have.addQuery('view', view);
    have.query();
    if (RESET_FORM) {
        var removed = 0;
        while (have.next()) {
            var del = new GlideRecord('sys_ui_element');
            del.addQuery('sys_ui_section', have.getUniqueValue());
            del.deleteMultiple();
            have.deleteRecord();
            removed++;
        }
        if (removed) gs.info('[PRK S5] Removed ' + removed + ' old section(s) from ' + VIEW_NAME);
        have = new GlideRecord('sys_ui_section');
        have.addQuery('name', TABLE);
        have.addQuery('view', view);
        have.query();
    }
    if (have.hasNext()) {
        gs.info('[PRK S5] Form sections already exist on ' + VIEW_NAME + ' - left as is');
    } else {
        var sec = new GlideRecord('sys_ui_section');
        sec.addQuery('name', TABLE);
        sec.addQuery('view', formSrc);
        sec.query();
        var n = 0;
        while (sec.next()) {
            var oldSec = sec.getUniqueValue();
            var ns = new GlideRecord('sys_ui_section');
            ns.initialize();
            ['name', 'caption', 'header', 'title', 'sys_domain'].forEach(function (f) {
                if (sec.isValidField(f)) ns.setValue(f, sec.getValue(f));
            });
            ns.setValue('view', view);
            var newSec = ns.insert();

            var el = new GlideRecord('sys_ui_element');
            el.addQuery('sys_ui_section', oldSec);
            el.orderBy('position');
            el.query();
            while (el.next()) {
                var ne = new GlideRecord('sys_ui_element');
                ne.initialize();
                ['element', 'position', 'type', 'sys_ui_formatter'].forEach(function (f) {
                    if (el.isValidField(f)) ne.setValue(f, el.getValue(f));
                });
                ne.setValue('sys_ui_section', newSec);
                ne.insert();
            }
            n++;
        }
        gs.info('[PRK S5] Copied ' + n + ' form section(s) from ' + FORM_SOURCE_VIEW);
    }

    // ---- 3. related lists: only KEEP ----
    var rl = new GlideRecord('sys_ui_related_list');
    rl.addQuery('name', TABLE);
    rl.addQuery('view', view);
    rl.query();
    var listId;
    if (rl.next()) {
        listId = rl.getUniqueValue();
        var old = new GlideRecord('sys_ui_related_list_entry');
        old.addQuery('list_id', listId);
        old.deleteMultiple();
    } else {
        rl.initialize();
        rl.setValue('name', TABLE);
        rl.setValue('view', view);
        listId = rl.insert();
    }
    KEEP.forEach(function (name, i) {
        var en = new GlideRecord('sys_ui_related_list_entry');
        en.initialize();
        en.setValue('list_id', listId);
        en.setValue('related_list', name);
        en.setValue('position', i);
        en.insert();
    });
    gs.info('[PRK S5] ' + VIEW_NAME + ' related lists: ' + (KEEP.join(', ') || 'none'));

    function getView(name) {
        var g = new GlideRecord('sys_ui_view');
        return g.get('name', name) ? g.getUniqueValue() : null;
    }
})();
