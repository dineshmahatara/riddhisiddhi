/**
 * Savings goals / pools
 */

function apiGetGoals() {
  requireAuth_(CONFIG.ROLES.MEMBER);
  const goals = getAllRows_(CONFIG.SHEETS.GOALS).map(sanitizeGoal_);
  return { success: true, data: goals };
}

function apiAddGoal(payload) {
  const user = requireAuth_(CONFIG.ROLES.TREASURER);
  const goal = {
    id: generateId_('GOL'),
    name: payload.name.trim(),
    description: payload.description || '',
    targetAmount: Number(payload.targetAmount) || 0,
    currentAmount: 0,
    deadline: payload.deadline || '',
    status: 'active',
    createdBy: user.email,
    createdAt: new Date().toISOString()
  };

  appendRow_(CONFIG.SHEETS.GOALS, goal);
  logAudit_('CREATE', 'goal', goal.id, goal.name);
  return { success: true, data: sanitizeGoal_(goal) };
}

function apiUpdateGoal(payload) {
  requireAuth_(CONFIG.ROLES.TREASURER);
  const { id, ...updates } = payload;
  const allowed = ['name', 'description', 'targetAmount', 'deadline', 'status'];
  const filtered = {};
  allowed.forEach(function (k) {
    if (updates[k] !== undefined) filtered[k] = updates[k];
  });

  if (!updateRow_(CONFIG.SHEETS.GOALS, id, filtered)) {
    throw new Error('Goal not found.');
  }

  logAudit_('UPDATE', 'goal', id, filtered);
  const goal = findRow_(CONFIG.SHEETS.GOALS, 'id', id);
  return { success: true, data: sanitizeGoal_(goal) };
}

function updateGoalAmount_(goalId, delta) {
  if (!goalId) return;
  const goal = findRow_(CONFIG.SHEETS.GOALS, 'id', goalId);
  if (!goal) return;
  const newAmount = (Number(goal.currentAmount) || 0) + delta;
  updateRow_(CONFIG.SHEETS.GOALS, goalId, { currentAmount: newAmount });
}

function sanitizeGoal_(g) {
  const target = Number(g.targetAmount) || 0;
  const current = Number(g.currentAmount) || 0;
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    targetAmount: target,
    currentAmount: current,
    progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    deadline: g.deadline,
    status: g.status,
    createdBy: g.createdBy,
    createdAt: g.createdAt
  };
}
