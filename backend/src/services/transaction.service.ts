import mongoose, { type ClientSession } from "mongoose";
import type { IUser } from "../models/user.model.js";
import { UserRole } from "../models/user.model.js";
import type { ITransaction } from "../models/transaction.model.js";
import {
  findUserById,
  saveUser,
} from "../repositories/user.repository.js";
import {
  createTransactions,
  createTransaction,
} from "../repositories/transaction.repository.js";

export interface CreditBalanceResult {
  sender: IUser;
  receiver: IUser;
  debitTransaction: ITransaction;
  creditTransaction: ITransaction;
}

export interface DebitBalanceResult {
  sender: IUser;
  receiver: IUser;
  creditTransaction: ITransaction;
  debitTransaction: ITransaction;
}

export async function creditBalanceService(
  senderId: string,
  receiverId: string,
  amount: number
): Promise<CreditBalanceResult> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await findUserById(senderId, { session });
    const receiver = await findUserById(receiverId, { session });

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can credit balance");
    }

    const senderBalanceBefore = sender.balance;
    const receiverBalanceBefore = receiver.balance;

    if (sender.role === UserRole.RESELLER) {
      if (sender.balance < amount) {
        throw new Error("Insufficient balance");
      }
      sender.balance -= amount;
    }

    const senderBalanceAfter = sender.balance;

    receiver.balance += amount;
    const receiverBalanceAfter = receiver.balance;

    const debitTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "debit",
          amount,
          balanceBefore: senderBalanceBefore,
          balanceAfter: senderBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const creditTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "credit",
          amount,
          balanceBefore: receiverBalanceBefore,
          balanceAfter: receiverBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const debitTransaction = debitTransactionDoc[0];
    const creditTransaction = creditTransactionDoc[0];

    sender.allTransaction.push(debitTransaction._id as mongoose.Types.ObjectId);
    receiver.allTransaction.push(
      creditTransaction._id as mongoose.Types.ObjectId
    );

    await saveUser(sender, session);
    await saveUser(receiver, session);

    await session.commitTransaction();

    return {
      sender,
      receiver,
      debitTransaction,
      creditTransaction,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function debitBalanceService(
  senderId: string,
  receiverId: string,
  amount: number
): Promise<DebitBalanceResult> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await findUserById(senderId, { session });
    const receiver = await findUserById(receiverId, { session });

    if (!sender) {
      throw new Error("Sender not found");
    }

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    if (sender.role !== UserRole.ADMIN && sender.role !== UserRole.RESELLER) {
      throw new Error("Only admin or reseller can debit balance");
    }

    if (receiver.balance < amount) {
      throw new Error("Insufficient balance in receiver account");
    }

    const senderBalanceBefore = sender.balance;
    const receiverBalanceBefore = receiver.balance;

    receiver.balance -= amount;
    const receiverBalanceAfter = receiver.balance;

    if (sender.role === UserRole.RESELLER) {
      sender.balance += amount;
    }

    const senderBalanceAfter = sender.balance;

    const creditTransactionDoc = await createTransactions(
      [
        {
          senderId: receiver._id,
          receiverId: sender._id,
          type: "credit",
          amount,
          balanceBefore: senderBalanceBefore,
          balanceAfter: senderBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const debitTransactionDoc = await createTransactions(
      [
        {
          senderId: sender._id,
          receiverId: receiver._id,
          type: "debit",
          amount,
          balanceBefore: receiverBalanceBefore,
          balanceAfter: receiverBalanceAfter,
          status: "success",
        },
      ],
      session
    );

    const creditTransaction = creditTransactionDoc[0];
    const debitTransaction = debitTransactionDoc[0];

    sender.allTransaction.push(
      creditTransaction._id as mongoose.Types.ObjectId
    );
    receiver.allTransaction.push(debitTransaction._id as mongoose.Types.ObjectId);

    await saveUser(sender, session);
    await saveUser(receiver, session);

    await session.commitTransaction();

    return {
      sender,
      receiver,
      creditTransaction,
      debitTransaction,
    };
  } catch (error) {
    await session.abortTransaction();

    try {
      await createTransaction({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        type: "debit",
        amount,
        balanceBefore: 0,
        balanceAfter: 0,
        status: "failed",
      });
    } catch (logError) {
      console.error("Failed to log transaction:", logError);
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
