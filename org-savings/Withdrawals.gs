/**
 * Withdrawal request workflow
 */

function apiRequestWithdrawal(payload) {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);
  const amount = Number(payload.amount);
  const minWithdrawal = Number(getSetting_('minWithdrawal', '10'));

  if (!amount || amount < minWithdrawal) {
    throw new Error('Minimum withdrawal is ' + minWithdrawal + '.');
  }

  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'email', user.email);
  if ((Number(member.balance) || 0) < amount) {
    throw new Error('Insufficient balance.');
  }

  const request = {
    id: generateId_('WDR'),
    memberId: member.id,
    memberEmail: member.email,
    amount: amount,
    reason: payload.reason || '',
    goalId: payload.goalId || '',
    status: CONFIG.WITHDRAWAL_STATUS.PENDING,
    reviewedBy: '',
    reviewedAt: '',
    reviewNotes: '',
    createdAt: new Date().toISOString()
  };

  appendRow_(CONFIG.SHEETS.WITHDRAWALS, request);
  logAudit_('CREATE', 'withdrawal_request', request.id, amount);

  return { success: true, data: sanitizeWithdrawal_(request) };
}

function apiGetWithdrawals(filters) {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);
  filters = filters || {};

  let requests = getAllRows_(CONFIG.SHEETS.WITHDRAWALS).map(sanitizeWithdrawal_);

  if (!hasRole_(user, CONFIG.ROLES.TREASURER)) {
    requests = requests.filter(function (r) {
      return r.memberEmail === user.email;
    });
  }

  if (filters.status) {
    requests = requests.filter(function (r) { return r.status === filters.status; });
  }

  requests.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return { success: true, data: requests };
}

function apiReviewWithdrawal(payload) {
  const user = requireAuth_(CONFIG.ROLES.TREASURER);
  const { id, action, reviewNotes } = payload;

  const request = findRow_(CONFIG.SHEETS.WITHDRAWALS, 'id', id);
  if (!request) throw new Error('Withdrawal request not found.');
  if (request.status !== CONFIG.WITHDRAWAL_STATUS.PENDING) {
    throw new Error('Request already processed.');
  }

  if (action === 'reject') {
    updateRow_(CONFIG.SHEETS.WITHDRAWALS, id, {
      status: CONFIG.WITHDRAWAL_STATUS.REJECTED,
      reviewedBy: user.email,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || ''
    });
    logAudit_('REJECT', 'withdrawal_request', id, reviewNotes);
    return { success: true, message: 'Withdrawal rejected.' };
  }

  if (action === 'approve') {
    const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', request.memberId);
    const amount = Number(request.amount);

    if ((Number(member.balance) || 0) < amount) {
      throw new Error('Member has insufficient balance.');
    }

    updateMemberBalance_(member.id, -amount);
    if (request.goalId) updateGoalAmount_(request.goalId, -amount);

    createTransaction_({
      memberId: member.id,
      memberEmail: member.email,
      type: CONFIG.TX_TYPES.WITHDRAWAL,
      amount: -amount,
      goalId: request.goalId || '',
      description: 'Withdrawal: ' + (request.reason || 'Approved'),
      reference: id,
      createdBy: user.email
    });

    updateRow_(CONFIG.SHEETS.WITHDRAWALS, id, {
      status: CONFIG.WITHDRAWAL_STATUS.COMPLETED,
      reviewedBy: user.email,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reviewNotes || ''
    });

    logAudit_('APPROVE', 'withdrawal_request', id, amount);
    return { success: true, message: 'Withdrawal approved and processed.' };
  }

  throw new Error('Invalid action. Use approve or reject.');
}

function sanitizeWithdrawal_(w) {
  return {
    id: w.id,
    memberId: w.memberId,
    memberEmail: w.memberEmail,
    amount: Number(w.amount) || 0,
    reason: w.reason,
    goalId: w.goalId,
    status: w.status,
    reviewedBy: w.reviewedBy,
    reviewedAt: w.reviewedAt,
    reviewNotes: w.reviewNotes,
    createdAt: w.createdAt
  };
}
