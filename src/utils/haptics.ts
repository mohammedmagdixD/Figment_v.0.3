export const isHapticsSupported = () =>
  typeof navigator !== "undefined" && "vibrate" in navigator;

export const haptics = {
  // Light tap — for selections, toggles
  light: () => isHapticsSupported() && navigator.vibrate(10),

  // Medium impact — for confirmations, successful actions
  medium: () => isHapticsSupported() && navigator.vibrate(30),

  // Heavy impact — for errors, destructive actions
  heavy: () => isHapticsSupported() && navigator.vibrate([20, 50, 20]),

  // Success pattern — for form submissions, saves
  success: () => isHapticsSupported() && navigator.vibrate([10, 30, 10]),

  // Error pattern
  error: () => isHapticsSupported() && navigator.vibrate([50, 30, 50, 30, 50]),
};
