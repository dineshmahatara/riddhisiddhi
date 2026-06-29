/**
 * Organization Savings System — Configuration
 */

const CONFIG = {
  SPREADSHEET_NAME: 'Org Savings Database',
  SHEETS: {
    MEMBERS: 'Members',
    TRANSACTIONS: 'Transactions',
    WITHDRAWALS: 'WithdrawalRequests',
    GOALS: 'SavingsGoals',
    SETTINGS: 'Settings',
    AUDIT: 'AuditLog'
  },
  ROLES: {
    ADMIN: 'admin',
    TREASURER: 'treasurer',
    MEMBER: 'member'
  },
  TX_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    ADJUSTMENT: 'adjustment',
    TRANSFER: 'transfer'
  },
  WITHDRAWAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    COMPLETED: 'completed'
  },
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_ORG_NAME: 'My Organization'
};

const HEADERS = {
  Members: ['id', 'email', 'name', 'role', 'phone', 'joinedDate', 'status', 'balance', 'notes'],
  Transactions: ['id', 'memberId', 'memberEmail', 'type', 'amount', 'goalId', 'description', 'reference', 'createdBy', 'createdAt'],
  WithdrawalRequests: ['id', 'memberId', 'memberEmail', 'amount', 'reason', 'goalId', 'status', 'reviewedBy', 'reviewedAt', 'reviewNotes', 'createdAt'],
  SavingsGoals: ['id', 'name', 'description', 'targetAmount', 'currentAmount', 'deadline', 'status', 'createdBy', 'createdAt'],
  Settings: ['key', 'value'],
  AuditLog: ['id', 'action', 'entity', 'entityId', 'userEmail', 'details', 'timestamp']
};
