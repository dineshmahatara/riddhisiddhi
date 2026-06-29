/**
 * Member management
 */

function addMember_(data) {
  const existing = findRow_(CONFIG.SHEETS.MEMBERS, 'email', data.email);
  if (existing) {
    throw new Error('Member with this email already exists.');
  }

  const member = {
    id: generateId_('MEM'),
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    role: data.role || CONFIG.ROLES.MEMBER,
    phone: data.phone || '',
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'active',
    balance: 0,
    notes: data.notes || ''
  };

  appendRow_(CONFIG.SHEETS.MEMBERS, member);
  logAudit_('CREATE', 'member', member.id, member.email);
  return member;
}

function apiGetMembers() {
  requireAuth_(CONFIG.ROLES.TREASURER);
  const members = getAllRows_(CONFIG.SHEETS.MEMBERS).map(sanitizeMember_);
  return { success: true, data: members };
}

function apiAddMember(payload) {
  requireAuth_(CONFIG.ROLES.ADMIN);
  const member = addMember_(payload);
  return { success: true, data: sanitizeMember_(member) };
}

function apiUpdateMember(payload) {
  requireAuth_(CONFIG.ROLES.ADMIN);
  const { id, ...updates } = payload;
  if (!id) throw new Error('Member ID required.');

  const allowed = ['name', 'role', 'phone', 'status', 'notes'];
  const filtered = {};
  allowed.forEach(function (k) {
    if (updates[k] !== undefined) filtered[k] = updates[k];
  });

  if (!updateRow_(CONFIG.SHEETS.MEMBERS, id, filtered)) {
    throw new Error('Member not found.');
  }

  logAudit_('UPDATE', 'member', id, filtered);
  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', id);
  return { success: true, data: sanitizeMember_(member) };
}

function apiGetMyProfile() {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);
  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'email', user.email);
  return { success: true, data: sanitizeMember_(member) };
}

function sanitizeMember_(m) {
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    phone: m.phone,
    joinedDate: m.joinedDate,
    status: m.status,
    balance: Number(m.balance) || 0,
    notes: m.notes
  };
}

function updateMemberBalance_(memberId, delta) {
  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', memberId);
  if (!member) throw new Error('Member not found.');
  const newBalance = (Number(member.balance) || 0) + delta;
  updateRow_(CONFIG.SHEETS.MEMBERS, memberId, { balance: newBalance });
  return newBalance;
}
