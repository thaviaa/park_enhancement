/**
 * OPTIONAL - only if Scott defines "responded" as "first work note / comment from the tech".
 *
 * 1. Create field on sc_task:  u_first_response_on  (Date/Time, label "First Response")
 * 2. Business Rule "PRK - Stamp first response"
 *      Table: sc_task | When: before | Update: true
 *      Condition: request_item.cat_item is Park & Rec Work Order
 *                 AND First Response is empty
 *                 AND (Work notes changes OR Additional comments changes)
 * 3. Change the SLA stop condition to: u_first_response_onISNOTEMPTY^ORstateIN3
 */
(function executeRule(current, previous) {
    // Ignore notes written by the requester or by integrations/system
    if (gs.getUserID() == current.request_item.requested_for + '' || gs.getUserName() == 'system')
        return;
    current.setValue('u_first_response_on', new GlideDateTime());
})(current, previous);
