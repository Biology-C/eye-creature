// Synchronous, instance-owned dispatch preserves the original call order.
export function createEvents() {
  const listeners = new Map();
  const off = (name, listener) => listeners.get(name)?.delete(listener);
  return {
    on(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
      return () => off(name, listener);
    },
    off,
    emit(name, payload) {
      for (const listener of [...(listeners.get(name) || [])]) listener(payload);
    },
  };
}
