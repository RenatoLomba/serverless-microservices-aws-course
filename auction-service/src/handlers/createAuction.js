import { v4 as uuid } from "uuid";
import { DynamoDB } from "aws-sdk";
import validator from "@middy/validator";
import { InternalServerError } from "http-errors";

import { enableCors } from "../lib/middlewares/enableCors";
import commonMiddleware from "../lib/commonMiddleware";
import { getValidatorOptions } from "../lib/getValidatorOptions";
import createAuctionSchema from "../lib/schemas/createAuctionSchema";

const dynamoDbDocument = new DynamoDB.DocumentClient();

const createAuction = enableCors(async (event, context) => {
  const { title } = event.body;
  const { email } = event.requestContext.authorizer;

  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1); // end in 1 hour

  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  try {
    await dynamoDbDocument
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(
      `Put object in DynamoDB ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify({ auction }),
  };
});

export const handler = commonMiddleware(createAuction).use(
  validator(getValidatorOptions(createAuctionSchema))
);
