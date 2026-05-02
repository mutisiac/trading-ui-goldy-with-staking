import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import Transaction, { type ITransaction } from "../models/transaction.model.js";

export async function createTransactions(
  docs: Partial<ITransaction>[],
  session?: ClientSession
): Promise<ITransaction[]> {
  return Transaction.create(docs, session ? { session } : {});
}

export async function createTransaction(
  doc: Partial<ITransaction>
): Promise<ITransaction> {
  return Transaction.create(doc);
}

export async function findTransactions(
  filter: Record<string, unknown>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    populate?: string | string[];
    lean?: boolean;
  }
): Promise<ITransaction[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = Transaction.find(filter) as any;
  if (options?.sort) chain.sort(options.sort);
  if (options?.limit) chain.limit(options.limit);
  if (options?.populate) chain.populate(options.populate);
  if (options?.lean) chain.lean();
  const result = await chain.exec();
  return result as ITransaction[];
}

export async function deleteTransactions(
  filter: Record<string, unknown>,
  session?: ClientSession
): Promise<{ deletedCount?: number }> {
  return Transaction.deleteMany(filter, session ? { session } : {});
}
