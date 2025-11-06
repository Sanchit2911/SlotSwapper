// server/src/utils/safeSessionHandler.ts
import mongoose from "mongoose";
import logger from "./logger";

let transactionsSupported: boolean | null = null;

export async function detectTransactionSupport(): Promise<boolean> {
  if (transactionsSupported !== null) return transactionsSupported;

  const start = Date.now();
  while (
    (!mongoose.connection || !mongoose.connection.db) &&
    Date.now() - start < 3000
  ) {
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!mongoose.connection.db) {
    logger.warn(
      "⚠️ Mongoose connection not ready — assuming transactions disabled."
    );
    transactionsSupported = false;
    return false;
  }

  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.command({ replSetGetStatus: 1 }).catch(() => null);
    transactionsSupported = !!info;
    logger.info(
      `🧭 MongoDB Transactions: ${
        transactionsSupported ? "ENABLED" : "DISABLED"
      }`
    );
    return transactionsSupported;
  } catch {
    logger.warn("⚠️ Could not verify replica set — disabling transactions.");
    transactionsSupported = false;
    return false;
  }
}

/**
 * Safely start a MongoDB session or mock one if transactions aren't supported.
 */
export async function startSafeSession(): Promise<
  mongoose.ClientSession & { inFakeMode?: boolean }
> {
  const supported = await detectTransactionSupport();

  if (!supported) {
    logger.warn(
      "🧭 Running in standalone MongoDB — transactions disabled. Using mock session."
    );

    const baseSession = {
      inFakeMode: true,
      startTransaction: () => {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession: () => {},
      inTransaction: () => false,
      withTransaction: async (fn: any) => fn(mockSession),
      hasEnded: false,
      advanceClusterTime: () => {},
      advanceOperationTime: () => {},
      id: undefined,
      client: mongoose.connection.getClient(),
      options: {},
      startTransactionOptions: undefined,
      clusterTime: undefined,
      operationTime: undefined,
      transaction: {
        state: "NO_TRANSACTION",
      },
    };

    // Create a Proxy to handle all property access dynamically
    const mockSession = new Proxy(baseSession, {
      get(target: any, prop: string) {
        // Return the actual property if it exists
        if (prop in target) {
          return target[prop];
        }
        // For methods, return a no-op function
        if (typeof prop === "string" && prop.startsWith("is")) {
          return () => false;
        }
        // For any unknown property, return empty object/undefined
        return undefined;
      },
    }) as unknown as mongoose.ClientSession & { inFakeMode: boolean };

    return mockSession;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  (session as any).inFakeMode = false;
  return session as mongoose.ClientSession & { inFakeMode: boolean };
}
