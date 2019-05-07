const logger = require('../config/logger');
const Audit = require('../app/models/audit');

/**
 * @typedef { Object } Changed
 * @property { String } key - the property that changed
 * @property { any } old - the old value of the property before change
 * @property { any } new - the new value of the property after change
 */

/**
 * @typedef { Object } AuditOptions
 * @property { String } target - the id of the target
 * @property { Number } targetModel - the model to use as ref for the target  
    0 - User  
    1 - Place  
    2 - Review  
    3 - Report

 * @property { Changed } changed - the object containing the details of any changes
 * @property { String } reason - the reason why the action was performed
 */

/**
 * @param { String } executor - the id of the user that performed the action
 * @param { Number } action - the action performed  
    0 - User Sign Up  
    1 - Verify Email  
    2 - Forgot Password  
    3 - Reset Password  
    4 - User Log In  
    5 - User Log Out  
    6 - User Update  
    11 - Place Add  
    12 - Place Update  
    13 - Place Delete  
    14 - Place Add Review  
    20 - Report User  
    21 - Report Place  
    --- Admin Only Actions ---  
    70 - Ban User  
    71 - Revoke User Ban  
    72 - Send Newsletter  
    77 - Accessed Logs  

 * @param { Number } actionType - the type of action performed  
    0 - CREATE  
    1 - ACCESS  
    2 - UPDATE  
    3 - DELETE  
    4 - ALL

 * @param { AuditOptions } opts - Available properties: target, targetModel, changed, reason
 */
module.exports = function(executor, action, actionType, opts) {
    if (executor === undefined || action === undefined || actionType === undefined) {
        console.log(`${executor} - ${action} - ${actionType}`);
        return logger.error('Missing required parameter(s) on function audit call.');
    }

    const data = {
        executor: executor,
        action: action,
        actionType: actionType
    }

    if (opts.target !== undefined) { 

        if (!opts.targetModel) { return logger.error('Audit target provided but no target model given.'); }

        data.target = opts.target;

        switch (opts.targetModel)
        {
        case 0: data.targetModel = 'User'; break;
        case 1: data.targetModel = 'Place'; break;
        case 2: data.targetModel = 'Review'; break;
        case 3: data.targetModel = 'Report'; break;
        default: return logger.error(`Invalid target model provided on audit: ${opts.targetModel}`);
        }
    }

    if (opts.changed) { data.changed = opts.changed; }
    if (opts.reason) { data.reason = opts.reason; }

    const audit = new Audit(data);
    console.log(audit);
    audit.save(err => err ? logger.error(err.stack) : console.log(audit));
}