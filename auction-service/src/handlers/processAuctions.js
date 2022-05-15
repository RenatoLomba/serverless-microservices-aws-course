import { InternalServerError } from "http-errors";

import { closeAuction } from "../lib/closeAuction";
import { getEndedAuctions } from "../lib/getEndedAuctions";

const processAuctions = async (event, context) => {
  try {
    const auctionsToClose = await getEndedAuctions();

    const closePromises = auctionsToClose.map((auction) =>
      closeAuction(auction)
    );

    await Promise.all(closePromises);

    return { closed: closePromises.length };
  } catch (error) {
    console.error(
      `Update objects in DynamoDB ${process.env.AUCTIONS_TABLE_NAME} resulted with an error: `,
      error
    );
    throw new InternalServerError(error);
  }
};

export const handler = processAuctions;
