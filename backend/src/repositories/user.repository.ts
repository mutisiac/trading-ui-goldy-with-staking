import type { ClientSession, FilterQuery, UpdateQuery } from "mongoose";
import mongoose from "mongoose";
import User, {
  type IUser,
  UserRole,
  UserStatus,
} from "../models/user.model.js";

export async function findUserById(
  id: string | mongoose.Types.ObjectId,
  options?: { select?: string; session?: ClientSession }
): Promise<IUser | null> {
  const q = User.findById(id).session(options?.session ?? null);
  if (options?.select) q.select(options.select);
  return q.exec();
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase().trim() });
}

export async function findUserByEmailWithPassword(
  email: string
): Promise<IUser | null> {
  return User.findOne({ email: email.toLowerCase().trim() }).select("+password");
}

export async function findUserByNumber(number: number): Promise<IUser | null> {
  return User.findOne({ number });
}

export async function estimatedUserCount(): Promise<number> {
  return User.estimatedDocumentCount();
}

export async function insertUser(
  data: Partial<IUser> & Record<string, unknown>,
  session?: ClientSession
): Promise<IUser> {
  if (session) {
    const docs = await User.create([data], { session });
    return docs[0];
  }
  return User.create(data);
}

export async function updateUserById(
  id: string | mongoose.Types.ObjectId,
  update: UpdateQuery<IUser>,
  options?: { new?: boolean; session?: ClientSession }
): Promise<IUser | null> {
  return User.findByIdAndUpdate(id, update, {
    new: options?.new ?? true,
    runValidators: true,
    session: options?.session,
  });
}

export async function saveUser(
  user: IUser,
  session?: ClientSession
): Promise<IUser> {
  return user.save(session ? { session } : {});
}

export async function findUsers(filter: FilterQuery<IUser>): Promise<IUser[]> {
  return User.find(filter).exec();
}

export async function findOneUser(
  filter: FilterQuery<IUser>
): Promise<IUser | null> {
  return User.findOne(filter).exec();
}

export async function updateOneUser(
  filter: FilterQuery<IUser>,
  update: UpdateQuery<IUser>,
  options?: { session?: ClientSession }
): Promise<void> {
  await User.updateOne(filter, update, { session: options?.session });
}

export { UserRole, UserStatus };
