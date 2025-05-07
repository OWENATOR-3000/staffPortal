/**
 * Permission helper functions for the Gmobility Staff Portal
 * These utilities help manage and check user permissions throughout the application
 */

/**
 * Checks if a user has a specific permission
 * @param {Array} userPermissions - Array of permission IDs the user has
 * @param {number} permissionId - The permission ID to check for
 * @returns {boolean} - True if the user has the permission, false otherwise
 */
export const hasPermission = (userPermissions, permissionId) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        console.warn('Invalid userPermissions provided', userPermissions);
        return false;
    }
    return userPermissions.includes(permissionId);
};

/**
 * Permission ID constants for easier reference
 */
export const PERMISSIONS = {
    // User management permissions
    VIEW_EMPLOYEES: 4,
    REGISTER_STAFF: 11,
    
    // Request permissions
    VIEW_REQUESTS: 13,
    APPROVE_REQUESTS: 15,
    CREATE_LEAVE: 17,
    CREATE_OVERTIME: 18,
    
    // Financial permissions
    VIEW_PAYROLL: 19,
    VIEW_COMMISSIONS: 24,
    
    // Document permissions
    UPLOAD_DOCUMENT: 22,
    
    // Report permissions
    VIEW_REPORTS: 26,
    CREATE_REPORT: 27,
    
    // View permissions
    VIEW_OVERTIME: 35,
    VIEW_LEAVE: 36,
    VIEW_PRINTED_REPORTS: 37,
    
    // Clocking permissions
    VIEW_CLOCKING: 2,
    MANAGE_CLOCKING: 3,
    
    // Messaging permission
    USE_MESSAGING: 1  // Updated to match the database permission ID for messaging
};

/**
 * Helper to debug permissions in the console
 * @param {Array} userPermissions - The user's permissions array
 */
export const debugPermissions = (userPermissions) => {
    if (!userPermissions || !Array.isArray(userPermissions)) {
        console.error('Invalid permissions array', userPermissions);
        return;
    }
    
    console.group('User Permissions');
    console.log('Total permissions:', userPermissions.length);
    console.log('Raw permissions:', userPermissions);
    
    const permissionNames = Object.entries(PERMISSIONS)
        .filter(([_, id]) => userPermissions.includes(id))
        .map(([name, _]) => name);
    
    console.log('Active permissions:', permissionNames);
    console.groupEnd();
};
