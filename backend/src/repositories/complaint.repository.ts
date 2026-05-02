import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import Complaint, { type IComplaint } from "../models/complaint.model.js";

export async function createComplaints(
  docs: Partial<IComplaint>[],
  session?: ClientSession
): Promise<IComplaint[]> {
  return Complaint.create(docs, session ? { session } : {});
}

export async function findComplaintById(
  id: string | mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<IComplaint | null> {
  return Complaint.findById(id).session(session ?? null).exec();
}

export async function deleteComplaintById(
  id: string | mongoose.Types.ObjectId,
  session?: ClientSession
): Promise<IComplaint | null> {
  return Complaint.findByIdAndDelete(id).session(session ?? null).exec();
}

export async function findComplaints(
  filter: Record<string, unknown>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    populate?: string | string[];
    lean?: boolean;
  }
): Promise<IComplaint[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = Complaint.find(filter) as any;
  if (options?.sort) chain.sort(options.sort);
  if (options?.limit) chain.limit(options.limit);
  if (options?.populate) chain.populate(options.populate);
  if (options?.lean) chain.lean();
  const result = await chain.exec();
  return result as IComplaint[];
}
