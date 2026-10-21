/**
 * Makes a non-button element (a list row, a table row) usable from the
 * keyboard: focusable with Tab and activated with Enter or Space, as a
 * real button would be.
 */
export const clickable = (handler) => ({
  role: 'button',
  tabIndex: 0,
  onClick: handler,
  onKeyDown: (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler(event);
    }
  }
});
