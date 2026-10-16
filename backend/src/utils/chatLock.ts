const chains = new Map<string, Promise<unknown>>();

export const withChatLock = async <T>(chatId: string, fn: () => Promise<T>): Promise<T> => {
  const previous = chains.get(chatId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const current = previous.then(
    () => gate,
    () => gate
  );
  chains.set(chatId, current);

  try {
    await previous.catch(() => undefined);
    return await fn();
  } finally {
    release();
    if (chains.get(chatId) === current) {
      chains.delete(chatId);
    }
  }
};
