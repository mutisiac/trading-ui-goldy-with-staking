import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import News, { type INews } from "../models/news.model.js";

export async function createNewsDoc(
  data: Partial<INews>
): Promise<INews> {
  return News.create(data);
}

export async function updateNewsById(
  id: string | mongoose.Types.ObjectId,
  update: Partial<Pick<INews, "title" | "description" | "status">>
): Promise<INews | null> {
  const payload: Partial<Pick<INews, "title" | "description" | "status">> = {};
  if (update.title !== undefined) payload.title = update.title;
  if (update.description !== undefined) payload.description = update.description;
  if (update.status !== undefined) payload.status = update.status;

  if (Object.keys(payload).length === 0) {
    return News.findById(id).exec();
  }

  return News.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).exec();
}

export async function deleteNewsById(
  id: string | mongoose.Types.ObjectId
): Promise<INews | null> {
  return News.findByIdAndDelete(id).exec();
}

export async function findNews(
  filter: FilterQuery<INews>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    populate?: string | string[];
    select?: string;
    lean?: boolean;
  }
): Promise<INews[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = News.find(filter) as any;
  if (options?.sort) chain.sort(options.sort);
  if (options?.limit) chain.limit(options.limit);
  if (options?.populate) chain.populate(options.populate);
  if (options?.select) chain.select(options.select);
  if (options?.lean) chain.lean();
  const result = await chain.exec();
  return result as INews[];
}

export async function findOneNews(
  filter: FilterQuery<INews>,
  options?: {
    sort?: Record<string, 1 | -1>;
    populate?: string | string[];
    select?: string;
    lean?: boolean;
  }
): Promise<INews | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = News.findOne(filter) as any;
  if (options?.sort) chain.sort(options.sort);
  if (options?.populate) chain.populate(options.populate);
  if (options?.select) chain.select(options.select);
  if (options?.lean) chain.lean();
  const result = await chain.exec();
  return result as INews | null;
}
