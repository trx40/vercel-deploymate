import fs from "fs";
import path from "path";

const getFilesRecursively = async (folderPath: string): Promise<string[]> => {
  const files = await fs.promises.readdir(folderPath);

  const tasks = files.map(async (file) => {
    const fullFilePath = path.join(folderPath, file);
    const stats = await fs.promises.stat(fullFilePath);

    if (stats.isDirectory()) {
      return getFilesRecursively(fullFilePath);
    } else {
      return [fullFilePath];
    }
  });

  return (await Promise.all(tasks)).flat();
};

export const getAllFiles = async (folderPath: string) => {
  try {
    return await getFilesRecursively(folderPath);
  } catch (error) {
    console.error("Error occurred:", error);
    return [];
  }
};
