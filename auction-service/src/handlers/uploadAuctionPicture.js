import middy from "@middy/core";
import validator from "@middy/validator";
import jsonErrorHandler from "middy-middleware-json-error-handler";
import { InternalServerError, BadRequest } from "http-errors";

import { getAuctionById } from "./getAuction";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { setAuctionPictureUrl } from "../lib/setAuctionPictureUrl";
import { enableCors } from "../lib/middlewares/enableCors";
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema";

const uploadAuctionPicture = enableCors(async (event) => {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  if (auction.seller !== email) {
    throw new BadRequest(
      `You are not authorized to upload a picture to this auction`
    );
  }

  const base64 = event.body.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  let uploadResult = null;

  try {
    const key = auction.id + ".jpg";

    console.log(
      `Uploading object ${key} to S3 bucket ${process.env.AUCTIONS_BUCKET_NAME}`
    );

    uploadResult = await uploadPictureToS3(key, buffer);

    console.log(`Upload successful`, uploadResult);
  } catch (error) {
    console.error(`Upload object to S3 resulted with an error: ${error}`);
    throw new InternalServerError(error);
  }

  let updatedAuction = null;

  try {
    console.log(
      `Updating auction ${id} with pictureUrl=${uploadResult.location}`
    );

    updatedAuction = await setAuctionPictureUrl(id, uploadResult.location);

    console.log(`Update successful`, updatedAuction);
  } catch (error) {
    console.error(
      `Update object ${id} on table ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auction: updatedAuction }),
  };
});

export const handler = middy(uploadAuctionPicture)
  .use(jsonErrorHandler())
  .use(
    validator({
      inputSchema: uploadAuctionPictureSchema,
    })
  );
