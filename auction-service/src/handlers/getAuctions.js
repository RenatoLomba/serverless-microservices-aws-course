import { DynamoDB } from "aws-sdk";
import validator from "@middy/validator";
import { InternalServerError } from "http-errors";

import commonMiddleware from "../lib/commonMiddleware";
import { enableCors } from "../lib/middlewares/enableCors";
import getAuctionsSchema from "../lib/schemas/getAuctionsSchema";
import { getValidatorOptions } from "../lib/getValidatorOptions";

const dynamoDbDocument = new DynamoDB.DocumentClient();

const getAuctions = enableCors(async (event, context) => {
  const { status } = event.queryStringParameters;
  let auctions = [];

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: process.env.STATUS_AND_END_DATE_INDEX_NAME,
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeValues: {
      ":status": status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  try {
    const result = await dynamoDbDocument.query(params).promise();

    auctions = result.Items;
  } catch (error) {
    console.error(
      `Scan objects from DynamoDB ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auctions }),
  };
});

export const handler = commonMiddleware(getAuctions).use(
  validator(getValidatorOptions(getAuctionsSchema))
);
