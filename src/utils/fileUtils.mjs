// utils/fileUtils.mjs
import fs from "fs";

/**
 * Removes a temporary file from the system.
 * @param {string} filePath - The path of the file to be removed.
 */
export const removeTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to remove temp file at ${filePath}:`, err);
      } else {
        console.log(`Temp file removed: ${filePath}`);
      }
    });
  }
};
