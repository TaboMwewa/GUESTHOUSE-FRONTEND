// src/utils/formatters.js

export const formatCurrency = (amount) => {
  const num = parseFloat(amount || 0);
  return `K ${num.toLocaleString('en-ZM', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-GB', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
};

export const formatMonth = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', { 
    month: 'long', 
    year: 'numeric' 
  });
};

export const formatShortDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Alias exports for backward compatibility during refactor
export const fmt = formatCurrency;
export const fmtDate = formatDate;