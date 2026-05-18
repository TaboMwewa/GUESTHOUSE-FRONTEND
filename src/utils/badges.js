import {
  ROOM_STATUS,
  BUDGET_STATUS,
  REQUEST_STATUS,
  ALLOCATION_STATUS
} from './constants';

// Badge configuration mapping
export const BADGE_CONFIG = {
  // Room statuses
  [ROOM_STATUS.AVAILABLE]: { class: 'badge-green', label: 'Available' },
  [ROOM_STATUS.OCCUPIED]: { class: 'badge-red', label: 'Occupied' },
  [ROOM_STATUS.MAINTENANCE]: { class: 'badge-gold', label: 'Maintenance' },
  
  // Budget statuses
  [BUDGET_STATUS.DRAFT]: { class: 'badge-gray', label: 'Draft' },
  [BUDGET_STATUS.PENDING]: { class: 'badge-gold', label: 'Pending' },
  [BUDGET_STATUS.APPROVED]: { class: 'badge-green', label: 'Approved' },
  [BUDGET_STATUS.REJECTED]: { class: 'badge-red', label: 'Rejected' },
  
  // Request statuses
  [REQUEST_STATUS.PENDING]: { class: 'badge-gold', label: 'Pending' },
  [REQUEST_STATUS.APPROVED]: { class: 'badge-green', label: 'Approved' },
  [REQUEST_STATUS.REJECTED]: { class: 'badge-red', label: 'Rejected' },

  [ALLOCATION_STATUS.CHECKED_OUT]: { class: 'badge-gray', label: 'Checked Out' },
  [ALLOCATION_STATUS.ACTIVE]: { class: 'badge-green', label: 'Active' },
};

export const getBadgeConfig = (status) => {
  return BADGE_CONFIG[status] || { class: 'badge-gray', label: status || 'Unknown' };
};

// Helper function to render badge (to be used in components)
export const getBadgeClass = (status) => {
  return getBadgeConfig(status).class;
};

export const getBadgeLabel = (status) => {
  return getBadgeConfig(status).label;
};