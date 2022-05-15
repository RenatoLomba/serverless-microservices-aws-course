import { DynamoDB } from "aws-sdk";
import { InternalServerError, BadRequest } from "http-errors";

import commonMiddleware from "../lib/commonMiddleware";

const dynamoDbDocument = new DynamoDB.DocumentClient();

export async function getAuctionById(id) {
  let auction = null;

  try {
    const result = await dynamoDbDocument
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
      })
      .promise();

    auction = result.Item;
  } catch (error) {
    console.error(
      `Query object ${id} from DynamoDB ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }

  if (!auction) {
    throw new BadRequest(`Auction ${id} not found`);
  }

  return auction;
}

async function getAuction(event, context) {
  const { id } = event.pathParameters;

  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify({ auction }),
  };
}

export const handler = commonMiddleware(getAuction);
