/**
 * Unified API router for client calls
 */

function apiCall(action, payload) {
  try {
    const handlers = {
      getCurrentUser: function () { return { success: true, data: getCurrentUser() }; },
      getDashboard: apiGetDashboard,
      getMembers: apiGetMembers,
      addMember: apiAddMember,
      updateMember: apiUpdateMember,
      getMyProfile: apiGetMyProfile,
      getGoals: apiGetGoals,
      addGoal: apiAddGoal,
      updateGoal: apiUpdateGoal,
      getTransactions: function () { return apiGetTransactions(payload); },
      recordDeposit: apiRecordDeposit,
      recordAdjustment: apiRecordAdjustment,
      requestWithdrawal: apiRequestWithdrawal,
      getWithdrawals: function () { return apiGetWithdrawals(payload); },
      reviewWithdrawal: apiReviewWithdrawal,
      getMemberStatement: apiGetMemberStatement,
      getAuditLog: apiGetAuditLog,
      getSettings: apiGetSettings,
      updateSettings: apiUpdateSettings,
      initializeDatabase: apiInitializeDatabase
    };

    const handler = handlers[action];
    if (!handler) {
      throw new Error('Unknown action: ' + action);
    }

    return handler(payload);
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error)
    };
  }
}
