const logger = require('../config/logger');
const Audit = require('../app/models/audit');

function undef(x) {
    return typeof x === 'undefined';
}

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
 * @param { String } executorId - the id of the user that performed the action
 * @param { Number } action - the action performed  
    0 - User Sign Up  
    1 - Verify Email  
    2 - Forgot Password  
    3 - Reset Password  
    4 - User Log In  
    5 - User Log Out  
    6 - User Profile Update  

    11 - Place Add  
    12 - Place Update  
    13 - Place Delete  
    14 - Add Review  
    15 - Delete Review  

    20 - Report   
    --- Admin Only Actions ---  
    70 - Ban User  
    71 - Revoke User Ban  
    72 - Verify License  
    73 - Reject License  
    77 - Fetch Access Logs  
    78 - Fetch Audit Logs

 * @param { Number } actionType - the type of action performed  
    0 - CREATE  
    1 - ACCESS  
    2 - UPDATE  
    3 - DELETE  
    4 - ALL (Default if none is provided)

 * @param { AuditOptions } opts - Available properties: target, targetModel, changed, reason
 */
function audit(executorId, ip, action, actionType=4, opts) {

    console.log(`Audit: ${executorId} - ${action} - ${actionType}`);

    if (undef(executorId) || undef(action) || undef(actionType)) {
        return logger.error('Missing required parameter(s) on function audit call.');
    }

    if (undef(ip)) {
        return logger.error('Missing IP Address on Audit.');
    }

    const data = {
        executor: executorId,
        action: action,
        actionType: actionType,
        ip: ip
    }

    if (!undef(opts)) {
        
        if (!undef(opts.target)) { 

            if (undef(opts.targetModel)) { return logger.error('Audit target provided but no target model given.'); }

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

        if (!undef(opts.changed)) { data.changed = opts.changed; }
        if (!undef(opts.reason)) { data.reason = opts.reason; }
    }

    const audit = new Audit(data);
    audit.save(err => err ? logger.error(err.stack) : console.log(audit));
}

exports.signup = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:Signup - User ID is undefined.'); }
    audit(userId, ip, 0, 0);
}

exports.verifyEmail = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:Verify Email - User ID is undefined.'); }
    audit(userId, ip, 1, 2);
}

exports.forgotPassword = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:Forgot Password - User ID is undefined.'); }
    audit(userId, ip, 2);
}

exports.resetPassword = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:Reset Password - User ID is undefined.'); }
    audit(userId, ip, 3, 2);
}

exports.userLogin = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:User Login - User ID is undefined.'); }
    audit(userId, ip, 4, 1);
}

exports.userLogout = function(userId, ip) {
    if (undef(userId)) { return logger.error('Audit:User Logout - User ID is undefined.'); }
    audit(userId, ip, 5, 4);
}

exports.userProfileUpdate = function(userId, ip, changed = { key: null, old: null, new: null }) {
    if (undef(userId)) { return logger.error('Audit:User Profile Update - User ID is undefined.'); }
    audit(userId, ip, 6, 2, {
        changed: {
            key: changed.key,
            old: changed.old,
            new: changed.new
        }
    });
}

exports.placeAdd = function(userId, ip, placeId,) {
    if (undef(userId)) { return logger.error('Audit:Place Add - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Add - Place ID is undefined.'); }

    audit(userId, ip, 11,0, {
        target: placeId, 
        targetModel: 1
    });
}

exports.placeUpdate = function(userId, ip, placeId, ip) {
    if (undef(userId)) { return logger.error('Audit:Place Update - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Update - Place ID is undefined.'); }

    audit(userId, ip, 12, 2, {
        target: placeId, 
        targetModel: 1
    });
}

exports.placeDelete = function(userId, ip, placeId, reason=null) {
    if (undef(userId)) { return logger.error('Audit:Place Delete - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Delete - Place ID is undefined.'); }

    audit(userId, ip, 13, 3, {
        target: placeId, 
        targetModel: 1,
        reason: reason
    });
}

exports.reviewAdd = function(userId, ip, placeId) {
    if (undef(userId)) { return logger.error('Audit:Review Add - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Review Add - Place ID is undefined.'); }

    audit(userId, ip, 14, 0, {
        target: placeId, 
        targetModel: 1
    });
}

exports.reviewDelete = function(userId, ip, placeId, reason=null) {
    if (undef(userId))  { return logger.error('Audit:Review Delete - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Review Delete - Place ID is undefined.'); }

    audit(userId, ip, 15, 3, {
        target: placeId, 
        targetModel: 1,
        reason: reason
    });
}

/**
 * @param { Number } targetModel - the model to use when populating the reported entity  
0 - User  
1 - Place  
 */
exports.report = function(userId, ip, reportedId, targetModel) {
    if (undef(userId))     { return logger.error('Audit:Report - User ID is undefined.'); }
    if (undef(reportedId)) { return logger.error('Audit:Report - Reported ID is undefined.'); }
    if (targetModel !== 0 && targetModel !== 1) { return logger.error('Audit:Report - Invalid Target Model.'); }

    audit(userId, ip, 20, 0, {
        target: reportedId,
        targetModel: targetModel
    });
}
exports.userReport = function(userId, ip, reporteUserdId) {
    if (undef(userId))         { return logger.error('Audit:User Report - User ID is undefined.'); }
    if (undef(reporteUserdId)) { return logger.error('Audit:User Report - Reported User ID is undefined.'); }
    audit(userId, ip, 20, 0, {
        target: reporteUserdId,
        targetModel: 0
    });
}

exports.placeReport = function(userId, ip, reportedPlaceId) {
    if (undef(userId))          { return logger.error('Audit:Place Report - User ID is undefined.'); }
    if (undef(reportedPlaceId)) { return logger.error('Audit:Place Report - Reported Place ID is undefined.'); }
    audit(userId, ip, 20, 0, {
        target: reportedPlaceId,
        targetModel: 1
    });
}

exports.ban = function(adminId, ip, bannedUserId, reason) {
    if (undef(adminId)) { return logger.error('Audit:Ban - Admin ID is undefined.'); }
    if (undef(bannedUserId)) { return logger.error('Audit:Ban - Banned User ID is undefined.'); }
    if (undef(reason)) { return logger.error('Audit:Ban - Reason is undefined.'); }

    audit(adminId, ip, 70, 2, { 
        target: bannedUserId, 
        targetModel: 0,
        reason: reason
    });
}

exports.banRevoke = function(adminId, ip, bannedUserId, reason) {
    if (undef(adminId)) { return logger.error('Audit:Ban - Admin ID is undefined.'); }
    if (undef(bannedUserId)) { return logger.error('Audit:Ban - Banned User ID is undefined.'); }
    if (undef(reason)) { return logger.error('Audit:Ban - Reason is undefined.'); }

    audit(adminId, ip, 71, 2, { 
        target: bannedUserId, 
        targetModel: 0,
        reason: reason
    });
}

exports.validateLicense = function(adminId, ip, placeownerId, valid) {
    if (undef(adminId)) { return logger.error('Audit:Validate License - Admin ID is undefined.'); }
    if (undef(placeownerId)) { return logger.error('Audit:Validate License - Placeowner ID is undefined.'); }
    if (undef(valid)) { return logger.error('Audit:Validate License - Valid is undefined.'); }

    audit(adminId, ip, valid ? 72 : 73, 2, { 
        target: placeownerId, 
        targetModel: 0
    });
}

exports.accessLogsFetch = function(adminId, ip) {
    if (undef(adminId)) { return logger.error('Audit:Access Logs Fetch - Admin ID is undefined.'); }
    audit(adminId, ip, 77, 1);
}

exports.auditLogsFetch = function(adminId, ip) {
    if (undef(adminId)) { return logger.error('Audit:Audit Logs Fetch - Admin ID is undefined.'); }
    audit(adminId, ip, 78, 1);
}