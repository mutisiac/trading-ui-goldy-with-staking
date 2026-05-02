import schedule from "node-schedule";
import Campaign from "../models/campaign.model.js";
import Transaction from "../models/transaction.model.js";
import Complaint from "../models/complaint.model.js";
import User, { UserRole } from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

async function deleteCloudinaryImage(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary")) return;

    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = `${folder}/${filename.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting Cloudinary image:", error);
  }
}

export function startCleanupJob(): void {
  schedule.scheduleJob("0 2 * * *", async () => {
    console.log("Starting automatic cleanup job...");

    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const users = await User.find({
        role: { $in: [UserRole.USER, UserRole.RESELLER] },
        createdAt: { $lt: threeMonthsAgo },
      });

      const stats = {
        campaignsDeleted: 0,
        transactionsDeleted: 0,
        complaintsDeleted: 0,
        cloudinaryDeleted: 0,
      };

      for (const user of users) {
        const oldCampaigns = await Campaign.find({
          _id: { $in: user.allCampaign },
          createdAt: { $lt: threeMonthsAgo },
        });

        for (const campaign of oldCampaigns) {
          if (campaign.media) {
            await deleteCloudinaryImage(campaign.media);
            stats.cloudinaryDeleted++;
          }
        }

        const campaignDeleteResult = await Campaign.deleteMany({
          _id: { $in: user.allCampaign },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.campaignsDeleted += campaignDeleteResult.deletedCount ?? 0;

        const transDeleteResult = await Transaction.deleteMany({
          _id: { $in: user.allTransaction },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.transactionsDeleted += transDeleteResult.deletedCount ?? 0;

        const complaintDeleteResult = await Complaint.deleteMany({
          _id: { $in: user.allComplaint },
          createdAt: { $lt: threeMonthsAgo },
        });
        stats.complaintsDeleted += complaintDeleteResult.deletedCount ?? 0;

        await User.updateOne(
          { _id: user._id },
          {
            $pull: {
              allCampaign: { $in: oldCampaigns.map((c) => c._id) },
              allTransaction: {
                $in: user.allTransaction,
              },
              allComplaint: {
                $in: user.allComplaint,
              },
            },
          }
        );
      }

      console.log("Cleanup completed successfully:", stats);
    } catch (error) {
      console.error("Cleanup job error:", error);
    }
  });

  console.log("Cleanup job scheduled for 2 AM daily");
}
