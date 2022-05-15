import { DynamoDB, SQS } from "aws-sdk";

const dynamoDbDocument = new DynamoDB.DocumentClient();
const sqsClient = new SQS();

export async function closeAuction(auction) {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  await dynamoDbDocument.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount, bidder } = highestBid;

  if (amount === 0) {
    await sqsClient
      .sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
          subject: "No bids on your auction item 😢",
          recipient: seller,
          body: `Oh no! Your item ${title} didn't get any bids, better luck next time...`,
        }),
      })
      .promise();

    return;
  }

  const notifySeller = sqsClient
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "Your item has been sold!",
        recipient: seller,
        body: `Woohoo! Your item ${title} has been sold for $${amount}`,
      }),
    })
    .promise();

  const notifyBidder = sqsClient
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "You won an auction!",
        recipient: bidder,
        body: `What a great deal! You get yourself a ${title} for $${amount}`,
      }),
    })
    .promise();

  await Promise.all([notifySeller, notifyBidder]);
}
