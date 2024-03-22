const AWS = require("aws-sdk");
import fs from "fs";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadFileToS3Stream = (fullFilePath: string) => {
  const key = fullFilePath.slice(__dirname.length + 1);
  const fileStream = fs.createReadStream(fullFilePath);

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: fileStream,
  };

  return s3.upload(params).promise();
};

export const uploadFiles = async (files: string[]) => {
  Promise.all(files.map((file) => uploadFileToS3Stream(file)))
    .then(() => console.log(`All files uploaded successfully`))
    .catch((err) => console.log(`Error: ${err}`));
};
