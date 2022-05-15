import { DynamoDB } from "aws-sdk";

const dynamoDbDocument = new DynamoDB.DocumentClient();

export async function setAuctionPictureUrl(auctionId, pictureUrl) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auctionId },
    UpdateExpression: "set pictureUrl = :pictureUrl",
    ExpressionAttributeValues: {
      ":pictureUrl": pictureUrl,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction = null;

  const result = await dynamoDbDocument.update(params).promise();

  updatedAuction = result.Attributes;

  return updatedAuction;
}
