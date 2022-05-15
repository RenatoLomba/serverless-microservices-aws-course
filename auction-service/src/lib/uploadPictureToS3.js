import { S3 } from "aws-sdk";

const s3Client = new S3();

export async function uploadPictureToS3(key, body) {
  const uploadResult = await s3Client
    .upload({
      Bucket: process.env.AUCTIONS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
    })
    .promise();

  const result = {
    key,
    bucket: uploadResult.Bucket,
    location: uploadResult.Location,
  };

  return result;
}
