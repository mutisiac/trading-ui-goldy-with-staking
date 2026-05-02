import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import Campaign, {
  type ICampaign,
  CampaignStats,
} from "../models/campaign.model.js";

export async function createCampaigns(
  docs: Partial<ICampaign>[],
  session?: ClientSession
): Promise<ICampaign[]> {
  return Campaign.create(docs, session ? { session } : {});
}

export async function findCampaignById(
  id: string | mongoose.Types.ObjectId
): Promise<ICampaign | null> {
  return Campaign.findById(id).exec();
}

export async function findCampaigns(
  filter: Record<string, unknown>,
  options?: {
    sort?: Record<string, 1 | -1>;
    limit?: number;
    populate?: string | string[];
    lean?: boolean;
  }
): Promise<ICampaign[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = Campaign.find(filter) as any;
  if (options?.sort) chain.sort(options.sort);
  if (options?.limit) chain.limit(options.limit);
  if (options?.populate) chain.populate(options.populate);
  if (options?.lean) chain.lean();
  const result = await chain.exec();
  return result as ICampaign[];
}

export async function deleteCampaigns(
  filter: Record<string, unknown>,
  session?: ClientSession
): Promise<{ deletedCount?: number }> {
  return Campaign.deleteMany(filter, session ? { session } : {});
}

export { CampaignStats };
