/**
 * Transactions — deposits, adjustments, transfers
 */

function apiRecordDeposit(payload) {
  const user = requireAuth_(CONFIG.ROLES.TREASURER);
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) throw new Error('Amount must be greater than zero.');

  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', payload.memberId);
  if (!member) throw new Error('Member not found.');

  const tx = createTransaction_({
    memberId: member.id,
    memberEmail: member.email,
    type: CONFIG.TX_TYPES.DEPOSIT,
    amount: amount,
    goalId: payload.goalId || '',
    description: payload.description || 'Deposit',
    reference: payload.reference || '',
    createdBy: user.email
  });

  updateMemberBalance_(member.id, amount);
  if (payload.goalId) updateGoalAmount_(payload.goalId, amount);

  return { success: true, data: tx };
}

function apiRecordAdjustment(payload) {
  const user = requireAuth_(CONFIG.ROLES.ADMIN);
  const amount = Number(payload.amount);
  if (amount === 0) throw new Error('Adjustment amount cannot be zero.');

  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', payload.memberId);
  if (!member) throw new Error('Member not found.');

  const tx = createTransaction_({
    memberId: member.id,
    memberEmail: member.email,
    type: CONFIG.TX_TYPES.ADJUSTMENT,
    amount: amount,
    goalId: payload.goalId || '',
    description: payload.description || 'Balance adjustment',
    reference: payload.reference || '',
    createdBy: user.email
  });

  updateMemberBalance_(member.id, amount);
  if (payload.goalId) updateGoalAmount_(payload.goalId, amount);

  return { success: true, data: tx };
}

function apiGetTransactions(filters) {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);
  filters = filters || {};

  let txs = getAllRows_(CONFIG.SHEETS.TRANSACTIONS).map(sanitizeTx_);

  if (!hasRole_(user, CONFIG.ROLES.TREASURER)) {
    txs = txs.filter(function (t) {
      return t.memberEmail === user.email;
    });
  }

  if (filters.memberId) {
    txs = txs.filter(function (t) { return t.memberId === filters.memberId; });
  }
  if (filters.type) {
    txs = txs.filter(function (t) { return t.type === filters.type; });
  }
  if (filters.goalId) {
    txs = txs.filter(function (t) { return t.goalId === filters.goalId; });
  }
  if (filters.fromDate) {
    txs = txs.filter(function (t) { return t.createdAt >= filters.fromDate; });
  }
  if (filters.toDate) {
    txs = txs.filter(function (t) { return t.createdAt <= filters.toDate + 'T23:59:59'; });
  }

  txs.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const limit = Number(filters.limit) || 100;
  return { success: true, data: txs.slice(0, limit) };
}

function createTransaction_(data) {
  const tx = {
    id: generateId_('TX'),
    memberId: data.memberId,
    memberEmail: data.memberEmail,
    type: data.type,
    amount: data.amount,
    goalId: data.goalId || '',
    description: data.description,
    reference: data.reference || '',
    createdBy: data.createdBy,
    createdAt: new Date().toISOString()
  };

  appendRow_(CONFIG.SHEETS.TRANSACTIONS, tx);
  logAudit_('CREATE', 'transaction', tx.id, tx.type + ' ' + tx.amount);
  return sanitizeTx_(tx);
}

function sanitizeTx_(t) {
  return {
    id: t.id,
    memberId: t.memberId,
    memberEmail: t.memberEmail,
    type: t.type,
    amount: Number(t.amount) || 0,
    goalId: t.goalId,
    description: t.description,
    reference: t.reference,
    createdBy: t.createdBy,
    createdAt: t.createdAt
  };
}
