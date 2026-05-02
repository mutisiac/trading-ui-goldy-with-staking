import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function cleanupUploadsFolder(): void {
  const uploadsPath = path.join(__dirname, "..", "..", "public", "uploads");

  try {
    if (!fs.existsSync(uploadsPath)) {
      console.log("Uploads folder does not exist. Nothing to clean.");
      return;
    }

    const files = fs.readdirSync(uploadsPath);

    if (files.length === 0) {
      console.log("Uploads folder is already empty.");
    } else {
      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        try {
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete ${file}:`, error);
        }
      }
      console.log(`Cleanup: ${deletedCount} file(s) deleted.`);
    }

    const gitkeepFilePath = path.join(uploadsPath, ".gitkeep");
    if (!fs.existsSync(gitkeepFilePath)) {
      fs.writeFileSync(gitkeepFilePath, "");
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

export default cleanupUploadsFolder;
