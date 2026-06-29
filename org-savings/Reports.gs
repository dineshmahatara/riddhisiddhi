/**
 * Reports and dashboard analytics
 */

function apiGetDashboard() {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);

  const members = getAllRows_(CONFIG.SHEETS.MEMBERS).filter(function (m) {
    return m.status !== 'inactive';
  });
  const txs = getAllRows_(CONFIG.SHEETS.TRANSACTIONS);
  const goals = getAllRows_(CONFIG.SHEETS.GOALS).filter(function (g) {
    return g.status === 'active';
  });
  const withdrawals = getAllRows_(CONFIG.SHEETS.WITHDRAWALS);

  const totalSavings = members.reduce(function (sum, m) {
    return sum + (Number(m.balance) || 0);
  }, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthlyDeposits = txs
    .filter(function (t) {
      return t.type === CONFIG.TX_TYPES.DEPOSIT && t.createdAt >= monthStart;
    })
    .reduce(function (sum, t) { return sum + (Number(t.amount) || 0); }, 0);

  const monthlyWithdrawals = txs
    .filter(function (t) {
      return t.type === CONFIG.TX_TYPES.WITHDRAWAL && t.createdAt >= monthStart;
    })
    .reduce(function (sum, t) { return sum + Math.abs(Number(t.amount) || 0); }, 0);

  const pendingWithdrawals = withdrawals.filter(function (w) {
    return w.status === CONFIG.WITHDRAWAL_STATUS.PENDING;
  }).length;

  const recentTxs = txs
    .map(sanitizeTx_)
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
    .slice(0, 8);

  if (!hasRole_(user, CONFIG.ROLES.TREASURER)) {
    recentTxs.length = 0;
    txs.filter(function (t) { return t.memberEmail === user.email; })
      .map(sanitizeTx_)
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 8)
      .forEach(function (t) { recentTxs.push(t); });
  }

  const topContributors = members
    .map(function (m) {
      return { name: m.name, email: m.email, balance: Number(m.balance) || 0 };
    })
    .sort(function (a, b) { return b.balance - a.balance; })
    .slice(0, 5);

  const goalProgress = goals.map(sanitizeGoal_);

  const myMember = findRow_(CONFIG.SHEETS.MEMBERS, 'email', user.email);

  return {
    success: true,
    data: {
      totalSavings: totalSavings,
      activeMembers: members.length,
      monthlyDeposits: monthlyDeposits,
      monthlyWithdrawals: monthlyWithdrawals,
      pendingWithdrawals: pendingWithdrawals,
      activeGoals: goals.length,
      myBalance: Number(myMember && myMember.balance) || 0,
      recentTransactions: recentTxs,
      topContributors: hasRole_(user, CONFIG.ROLES.TREASURER) ? topContributors : [],
      goalProgress: goalProgress,
      currency: getSetting_('currency', CONFIG.DEFAULT_CURRENCY)
    }
  };
}

function apiGetMemberStatement(payload) {
  const user = requireAuth_(CONFIG.ROLES.MEMBER);
  let memberId = payload && payload.memberId;

  if (!memberId || !hasRole_(user, CONFIG.ROLES.TREASURER)) {
    const member = findRow_(CONFIG.SHEETS.MEMBERS, 'email', user.email);
    memberId = member.id;
  }

  const member = findRow_(CONFIG.SHEETS.MEMBERS, 'id', memberId);
  if (!member) throw new Error('Member not found.');

  const txs = getAllRows_(CONFIG.SHEETS.TRANSACTIONS)
    .filter(function (t) { return t.memberId === memberId; })
    .map(sanitizeTx_)
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  const totalDeposits = txs
    .filter(function (t) { return t.type === CONFIG.TX_TYPES.DEPOSIT; })
    .reduce(function (s, t) { return s + t.amount; }, 0);

  const totalWithdrawals = txs
    .filter(function (t) { return t.type === CONFIG.TX_TYPES.WITHDRAWAL; })
    .reduce(function (s, t) { return s + Math.abs(t.amount); }, 0);

  return {
    success: true,
    data: {
      member: sanitizeMember_(member),
      transactions: txs,
      summary: {
        totalDeposits: totalDeposits,
        totalWithdrawals: totalWithdrawals,
        currentBalance: Number(member.balance) || 0
      }
    }
  };
}

function apiGetAuditLog() {
  requireAuth_(CONFIG.ROLES.ADMIN);
  const logs = getAllRows_(CONFIG.SHEETS.AUDIT)
    .sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); })
    .slice(0, 200);
  return { success: true, data: logs };
}

function apiGetSettings() {
  requireAuth_(CONFIG.ROLES.ADMIN);
  return {
    success: true,
    data: {
      orgName: getSetting_('orgName', CONFIG.DEFAULT_ORG_NAME),
      currency: getSetting_('currency', CONFIG.DEFAULT_CURRENCY),
      minWithdrawal: getSetting_('minWithdrawal', '10'),
      requireApproval: getSetting_('requireApproval', 'true'),
      autoEnroll: getSetting_('autoEnroll', 'false'),
      fiscalYearStart: getSetting_('fiscalYearStart', '01')
    }
  };
}

function apiUpdateSettings(payload) {
  requireAuth_(CONFIG.ROLES.ADMIN);
  const keys = ['orgName', 'currency', 'minWithdrawal', 'requireApproval', 'autoEnroll', 'fiscalYearStart'];
  keys.forEach(function (key) {
    if (payload[key] !== undefined) {
      setSetting_(key, payload[key]);
    }
  });
  logAudit_('UPDATE', 'settings', 'global', payload);
  return apiGetSettings();
}

function apiInitializeDatabase() {
  requireAuth_(CONFIG.ROLES.ADMIN);
  return initializeDatabase();
}
