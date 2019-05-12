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
    6 - User Update (Self)  
    11 - Place Add  
    12 - Place Update  
    13 - Place Delete  
    14 - Add Review  
    15 - Delete Review  
    20 - Report User  
    21 - Report Place  
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
function audit(executorId, action, actionType=4, opts) {

    console.log(`Audit: ${executorId} - ${action} - ${actionType}`);

    if (undef(executorId) || undef(action) || undef(actionType)) {
        return logger.error('Missing required parameter(s) on function audit call.');
    }

    const data = {
        executor: executorId,
        action: action,
        actionType: actionType
    }

    if (!undef(opts)) {
        
        if (!undef(opts.target)) { 

            if (undef(targetModel)) { return logger.error('Audit target provided but no target model given.'); }

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

exports.signup = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Signup - User ID is undefined.'); }
    audit(userId, 0, 0);
}

exports.verifyEmail = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Verify Email - User is undefined.'); }
    audit(userId, 1, 2, {
        changed: {
            key: 'account.status',
            old: 0,
            new: 1
        }
    });
}

exports.forgotPassword = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Forgot Password - User is undefined.'); }
    audit(userId, 2);
}

exports.resetPassword = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Forgot Password - User is undefined.'); }
    audit(userId, 3, 2, { 
        changed: {
            key: 'account.password',
            old: '<secret>',
            new: '<secret>'
        }
    });
}

exports.login = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Login - User ID is undefined.'); }
    audit(userId, 4, 1);
}

exports.logout = function(userId) {
    if (undef(userId)) { return logger.error('Audit:Logout - User ID is undefined.'); }
    audit(userId, 5, 1);
}

exports.userUpdate = function(userId) {
    if (undef(userId)) { return logger.error('Audit:User Update - User ID is undefined.'); }
    audit(userId, 6, 2);
}

exports.userUpdateImage = function(userId, oldImage, newImage) {
    if (undef(userId)) { return logger.error('Audit:User Update Image - User ID is undefined.'); }
    if (undef(oldImage)) { return logger.error('Audit:User Update Image - Old Image is undefined.'); }
    if (undef(newImage)) { return logger.error('Audit:User Update Image - New Image is undefined.'); }
    audit(userId, 6, 2, {
        changed: {
            key: 'image',
            old: oldImage,
            new: newImage
        }
    })
}

exports.placeAdd = function(userId, placeId) {
    if (undef(userId)) { return logger.error('Audit:Place Add - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Add - Place ID is undefined.'); }

    audit(userId, 11,0, {
        target: placeId, 
        targetModel: 'Place'
    });
}

exports.placeUpdate = function(userId, placeId) {
    if (undef(userId)) { return logger.error('Audit:Place Update - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Update - Place ID is undefined.'); }

    audit(userId, 12, 2, {
        target: placeId, 
        targetModel: 'Place'
    });
}

exports.placeDelete = function(userId, placeId, reason=null) {
    if (undef(userId)) { return logger.error('Audit:Place Delete - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Place Delete - Place ID is undefined.'); }

    audit(userId, 13, 3, {
        target: placeId, 
        targetModel: 'Place',
        reason: reason
    });
}

exports.reviewAdd = function(userId, placeId) {
    if (undef(userId)) { return logger.error('Audit:Review Add - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Review Add - Place ID is undefined.'); }

    audit(userId, 14, 0, {
        target: placeId, 
        targetModel: 'Place'
    });
}

exports.reviewDelete = function(userId, placeId, reason=null) {
    if (undef(userId)) { return logger.error('Audit:Review Delete - User ID is undefined.'); }
    if (undef(placeId)) { return logger.error('Audit:Review Delete - Place ID is undefined.'); }

    audit(userId, 15, 3, {
        target: placeId, 
        targetModel: 'Place',
        reason: reason
    });
}

exports.userReport = function(userId, reporteUserdId) {
    if (undef(userId)) { return logger.error('Audit:User Report - User ID is undefined.'); }
    if (undef(reporteUserdId)) { return logger.error('Audit:User Report - Reported User ID is undefined.'); }
    audit(userId, 20, 0, {
        target: reporteUserdId,
        targetModel: 0
    });
}

exports.placeReport = function(userId, reportedPlaceId) {
    if (undef(userId)) { return logger.error('Audit:Place Report - User ID is undefined.'); }
    if (undef(reportedPlaceId)) { return logger.error('Audit:Place Report - Reported Place ID is undefined.'); }
    audit(userId, 21, 0, {
        target: reportedPlaceId,
        targetModel: 1
    });
}

exports.ban = function(adminId, bannedUserId, reason) {
    if (undef(adminId)) { return logger.error('Audit:Ban - Admin ID is undefined.'); }
    if (undef(bannedUserId)) { return logger.error('Audit:Ban - Banned User ID is undefined.'); }
    if (undef(reason)) { return logger.error('Audit:Ban - Reason is undefined.'); }

    audit(adminId, 70, 2, { 
        target: bannedUserId, 
        targetModel: 0,
        reason: reason
    });
}

exports.banRevoke = function(adminId, bannedUserId, reason) {
    if (undef(adminId)) { return logger.error('Audit:Ban - Admin ID is undefined.'); }
    if (undef(bannedUserId)) { return logger.error('Audit:Ban - Banned User ID is undefined.'); }
    if (undef(reason)) { return logger.error('Audit:Ban - Reason is undefined.'); }

    audit(adminId, 71, 2, { 
        target: bannedUserId, 
        targetModel: 0,
        reason: reason
    });
}

exports.validateLicense = function(adminId, placeownerId, valid) {
    if (undef(adminId)) { return logger.error('Audit:Validate License - Admin ID is undefined.'); }
    if (undef(placeownerId)) { return logger.error('Audit:Validate License - Placeowner ID is undefined.'); }
    if (undef(valid)) { return logger.error('Audit:Validate License - Valid is undefined.'); }

    audit(adminId, valid ? 72 : 73, 2, { 
        target: placeownerId, 
        targetModel: 0
    });
}

exports.accessLogsFetch = function(adminId) {
    if (undef(adminId)) { return logger.error('Audit:Access Logs Fetch - Admin ID is undefined.'); }
    audit(adminId, 77, 1);
}

exports.auditLogsFetch = function(adminId) {
    if (undef(adminId)) { return logger.error('Audit:Audit Logs Fetch - Admin ID is undefined.'); }
    audit(adminId, 78, 1);
}