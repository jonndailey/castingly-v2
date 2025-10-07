import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options: Options) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (token: string, limit: number) =>
      new Promise<{ success: boolean; remaining: number }>((resolve) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1]);
          resolve({ success: true, remaining: limit - 1 });
        } else if (tokenCount[0] < limit) {
          tokenCount[0] += 1;
          tokenCache.set(token, tokenCount);
          resolve({ success: true, remaining: limit - tokenCount[0] });
        } else {
          resolve({ success: false, remaining: 0 });
        }
      }),
  };
}