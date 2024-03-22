import { exec, spawn } from "child_process";
import path from "path";

export const buildProjectWithVolume = (
  folderPrefix: string,
  folderName: string
) => {
  const fullFolderPath = path.join(__dirname, folderPrefix);
  const buildFolderPath = path.join(__dirname, folderName);
  return new Promise((resolve) => {
    const child = exec(
      `docker run -id --name=node-builder2 -v ${fullFolderPath}:/app -w /app node:18-alpine`,
      (err) => {
        if (err) {
          console.error("Error initializing container", err);
        } else {
          exec(`docker exec node-builder2 npm install`, (err) => {
            if (err) {
              console.error("Error installing dependencies:", err);
            } else {
              exec(`docker exec node-builder2 npm run build`, (err) => {
                if (err) {
                  console.error("Error building project", err);
                } else {
                  exec(
                    `docker cp node-builder2:/app/build ${buildFolderPath} && docker stop node-builder2 && docker rm node-builder2`,
                    (err) => {
                      if (err) {
                        console.error("Error copying build files", err);
                      } else {
                        resolve("Built project successfully");
                      }
                    }
                  );
                }
              });
            }
          });
        }
      }
    );
  });
};
