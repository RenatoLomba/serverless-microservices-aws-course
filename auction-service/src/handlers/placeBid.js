import validator from "@middy/validator";
import { DynamoDB } from "aws-sdk";
import { BadRequest } from "http-errors";

import commonMiddleware from "../lib/commonMiddleware";
import { getAuctionById } from "./getAuction";
import placeBidSchema from "../lib/schemas/placeBidSchema";
import { getValidatorOptions } from "../lib/getValidatorOptions";
import { enableCors } from "../lib/middlewares/enableCors";

const dynamoDbDocument = new DynamoDB.DocumentClient();

const placeBid = enableCors(async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  const validateAuctionStatus = (status) => {
    if (status !== "OPEN") {
      throw new BadRequest(`This auction is already closed`);
    }
  };

  validateAuctionStatus(auction.status);

  const validateBidAmount = (amount, highestBidAmount) => {
    if (amount <= highestBidAmount) {
      throw new BadRequest(`Your bid must be higher than ${highestBidAmount}`);
    }
  };

  validateBidAmount(amount, auction.highestBid.amount);

  const validateSeller = (auctionSeller, userEmail) => {
    if (auctionSeller === userEmail) {
      throw new BadRequest(`You cannot bid on your own auctions`);
    }
  };

  validateSeller(auction.seller, email);

  const validateBidder = (highestBidder, userEmail) => {
    if (highestBidder === userEmail) {
      throw new BadRequest(`You are already the highest bidder`);
    }
  };

  validateBidder(auction.highestBid.bidder, email);

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction = null;

  try {
    const result = await dynamoDbDocument.update(params).promise();

    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(
      `Update object ${id} in DynamoDB ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ auction: updatedAuction }),
  };
});

export const handler = commonMiddleware(placeBid).use(
  validator(getValidatorOptions(placeBidSchema))
);
