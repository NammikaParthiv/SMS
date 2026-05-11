import Log from "../models/Log.js";

export const logSystemEvent = async ({ operator, action, target = "", status = "Success" }) => {
  try {
    if (!operator || !action) return;

    await Log.create({
      operator,
      action,
      target,
      status,
    });
  } catch {
    // Logging must never break primary request flow.
  }
};
