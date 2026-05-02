import mongoose from "mongoose";
import type { IUser } from "../models/user.model.js";
import { UserRole, UserStatus } from "../models/user.model.js";
import {
  findUserByEmail,
  findUserById,
  findUserByNumber,
  insertUser,
  saveUser,
  updateUserById,
} from "../repositories/user.repository.js";
import { hashPassword } from "../utils/hash-password.utils.js";
import type {
  ChangeOwnPasswordBody,
  ChangePasswordBody,
  CreateUserBody,
  UpdateUserBody,
} from "../validation/user.schemas.js";

export async function createManagedUser(
  creatorId: mongoose.Types.ObjectId,
  body: CreateUserBody,
  imagePath: string
): Promise<IUser> {
  const existingEmail = await findUserByEmail(body.email);
  if (existingEmail) {
    const err = new Error("EMAIL_EXISTS") as Error & { code: string };
    err.code = "EMAIL_EXISTS";
    throw err;
  }

  const existingNumber = await findUserByNumber(body.number);
  if (existingNumber) {
    const err = new Error("NUMBER_EXISTS") as Error & { code: string };
    err.code = "NUMBER_EXISTS";
    throw err;
  }

  const creator = await findUserById(creatorId);
  if (
    !creator ||
    (creator.role !== UserRole.ADMIN && creator.role !== UserRole.RESELLER)
  ) {
    const err = new Error("FORBIDDEN_ROLE") as Error & { code: string };
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }

  const hashedPassword = await hashPassword(body.password);

  const newUser = await insertUser({
    companyName: body.companyName,
    email: body.email.toLowerCase().trim(),
    password: hashedPassword,
    number: body.number,
    image: imagePath,
    balance: body.balance,
    userID: creatorId,
    role: body.role ?? UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  if (body.role === UserRole.RESELLER) {
    creator.allReseller.push(newUser._id as mongoose.Types.ObjectId);
  } else if (body.role === UserRole.USER) {
    creator.allUsers.push(newUser._id as mongoose.Types.ObjectId);
  }

  await saveUser(creator);

  return newUser;
}

export async function softDeleteUser(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (
    !admin ||
    (admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER)
  ) {
    const err = new Error("FORBIDDEN_ROLE") as Error & { code: string };
    err.code = "FORBIDDEN_ROLE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (user.status === UserStatus.DELETED) {
    const err = new Error("ALREADY_DELETED") as Error & { code: string };
    err.code = "ALREADY_DELETED";
    throw err;
  }

  user.status = UserStatus.DELETED;
  user.deletedAt = new Date();
  await saveUser(user);
}

export async function freezeUserAccount(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (
    !admin ||
    (admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER)
  ) {
    const err = new Error("FORBIDDEN_FREEZE") as Error & { code: string };
    err.code = "FORBIDDEN_FREEZE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (user.status !== UserStatus.ACTIVE) {
    const err = new Error("NOT_ACTIVE") as Error & { code: string };
    err.code = "NOT_ACTIVE";
    throw err;
  }

  user.status = UserStatus.INACTIVE;
  await saveUser(user);
}

export async function unfreezeUserAccount(
  actorId: mongoose.Types.ObjectId,
  targetUserId: string
): Promise<void> {
  const admin = await findUserById(actorId);
  if (
    !admin ||
    (admin.role !== UserRole.ADMIN && admin.role !== UserRole.RESELLER)
  ) {
    const err = new Error("FORBIDDEN_UNFREEZE") as Error & { code: string };
    err.code = "FORBIDDEN_UNFREEZE";
    throw err;
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  user.status = UserStatus.ACTIVE;
  await saveUser(user);
}

export async function updateManagedUser(
  authenticatedUser: IUser,
  targetUserId: string,
  body: UpdateUserBody
): Promise<IUser> {
  const isOwner = authenticatedUser._id.toString() === targetUserId;
  const isAdminOrReseller =
    authenticatedUser.role === UserRole.ADMIN ||
    authenticatedUser.role === UserRole.RESELLER;

  if (!isOwner && !isAdminOrReseller) {
    const err = new Error("FORBIDDEN_UPDATE") as Error & { code: string };
    err.code = "FORBIDDEN_UPDATE";
    throw err;
  }

  const updateFields: Record<string, string | number> = {};
  if (body.companyName !== undefined) {
    updateFields.companyName = body.companyName;
  }
  if (body.email !== undefined) {
    updateFields.email = body.email;
  }
  if (body.number !== undefined) {
    updateFields.number = body.number;
  }

  if (Object.keys(updateFields).length === 0) {
    const err = new Error("NO_FIELDS") as Error & { code: string };
    err.code = "NO_FIELDS";
    throw err;
  }

  try {
    const updatedUser = await updateUserById(targetUserId, {
      $set: updateFields,
    });
    if (!updatedUser) {
      const err = new Error("USER_NOT_FOUND") as Error & { code: string };
      err.code = "USER_NOT_FOUND";
      throw err;
    }
    return updatedUser;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      const err = new Error("DUPLICATE_EMAIL") as Error & { code: string };
      err.code = "DUPLICATE_EMAIL";
      throw err;
    }
    throw error;
  }
}

export async function changeUserPasswordByAdmin(
  currentUserId: mongoose.Types.ObjectId,
  targetUserId: string,
  body: ChangePasswordBody
): Promise<IUser> {
  if (body.password !== body.confirmPassword) {
    const err = new Error("PASSWORD_MISMATCH") as Error & { code: string };
    err.code = "PASSWORD_MISMATCH";
    throw err;
  }

  const currentUser = await findUserById(currentUserId);
  if (!currentUser) {
    const err = new Error("AUTH_USER_NOT_FOUND") as Error & { code: string };
    err.code = "AUTH_USER_NOT_FOUND";
    throw err;
  }

  if (
    currentUser.role !== UserRole.ADMIN &&
    currentUser.role !== UserRole.RESELLER
  ) {
    const err = new Error("FORBIDDEN_PASSWORD") as Error & { code: string };
    err.code = "FORBIDDEN_PASSWORD";
    throw err;
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (targetUser.role === UserRole.ADMIN) {
    const err = new Error("CANNOT_CHANGE_ADMIN_PW") as Error & { code: string };
    err.code = "CANNOT_CHANGE_ADMIN_PW";
    throw err;
  }

  const manager = await findUserById(currentUserId, {
    select: "allReseller allUsers role",
  });
  if (!manager) {
    const err = new Error("AUTH_USER_NOT_FOUND") as Error & { code: string };
    err.code = "AUTH_USER_NOT_FOUND";
    throw err;
  }

  const isInResellerList = manager.allReseller.some(
    (id) => id.toString() === targetUserId
  );
  const isInUserList = manager.allUsers.some(
    (id) => id.toString() === targetUserId
  );

  if (!isInResellerList && !isInUserList) {
    const err = new Error("NOT_YOUR_USER") as Error & { code: string };
    err.code = "NOT_YOUR_USER";
    throw err;
  }

  targetUser.password = await hashPassword(body.password);
  await saveUser(targetUser);

  return targetUser;
}

export async function changeOwnPassword(
  userId: mongoose.Types.ObjectId,
  body: ChangeOwnPasswordBody
): Promise<void> {
  if (body.newPassword !== body.confirmPassword) {
    const err = new Error("PASSWORD_MISMATCH") as Error & { code: string };
    err.code = "PASSWORD_MISMATCH";
    throw err;
  }

  const user = await findUserById(userId);
  if (!user) {
    const err = new Error("USER_NOT_FOUND") as Error & { code: string };
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  user.password = await hashPassword(body.newPassword);
  await saveUser(user);
}
