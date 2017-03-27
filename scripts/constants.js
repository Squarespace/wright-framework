export const authenticated = document.documentElement.getAttribute('data-authenticated-account') === '';
export const debug = false;

export const indexEditEvents = {
  enabled: 'sqs-flight-mode-enabled',
  disabled: 'sqs-flight-mode-disabled',
  deleted: 'sqs-stacked-items-dom-deleted',
  reorder: 'sqs-stacked-items-dom-reorder'
};