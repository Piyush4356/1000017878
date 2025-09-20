export const LoggingMiddleware = (action, payload) => {
  console.log(`[LOG] ${action}:`, payload);
};