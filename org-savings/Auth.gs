/**
 * Authentication and authorization
 */

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    return { authenticated: false, error: 'Sign in with a Google account to access this system.' };
  }

  let member = findRow_(CONFIG.SHEETS.MEMBERS, 'email', email);

  if (!member) {
    const autoEnroll = getSetting_('autoEnroll', 'false') === 'true';
    if (autoEnroll) {
      member = addMember_({
        email: email,
        name: email.split('@')[0],
        role: CONFIG.ROLES.MEMBER,
        phone: '',
        notes: 'Auto-enrolled'
      });
    } else {
      return {
        authenticated: true,
        authorized: false,
        email: email,
        error: 'Your account is not registered. Contact an administrator.'
      };
    }
  }

  if (member.status === 'inactive') {
    return {
      authenticated: true,
      authorized: false,
      email: email,
      error: 'Your account has been deactivated.'
    };
  }

  return {
    authenticated: true,
    authorized: true,
    email: email,
    id: member.id,
    name: member.name,
    role: member.role,
    balance: Number(member.balance) || 0
  };
}

function requireAuth_(minRole) {
  const user = getCurrentUser();
  if (!user.authenticated || !user.authorized) {
    throw new Error(user.error || 'Unauthorized');
  }

  const roleHierarchy = {};
  roleHierarchy[CONFIG.ROLES.MEMBER] = 1;
  roleHierarchy[CONFIG.ROLES.TREASURER] = 2;
  roleHierarchy[CONFIG.ROLES.ADMIN] = 3;

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[minRole] || 1;

  if (userLevel < requiredLevel) {
    throw new Error('Insufficient permissions. Required role: ' + minRole);
  }

  return user;
}

function hasRole_(user, role) {
  const roleHierarchy = {};
  roleHierarchy[CONFIG.ROLES.MEMBER] = 1;
  roleHierarchy[CONFIG.ROLES.TREASURER] = 2;
  roleHierarchy[CONFIG.ROLES.ADMIN] = 3;
  return (roleHierarchy[user.role] || 0) >= (roleHierarchy[role] || 0);
}
