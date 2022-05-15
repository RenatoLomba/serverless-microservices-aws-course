import { SES } from "aws-sdk";

const sesClient = new SES({
  region: process.env.AWS_SES_REGION,
});

async function sendMail(event, context) {
  const record = event.Records[0];

  console.log("record processing", record);

  const data = JSON.parse(record.body);
  const { subject, body, recipient } = data;

  const params = {
    Source: process.env.AWS_SES_SOURCE_EMAIL,
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: subject,
      },
    },
  };

  try {
    const result = await sesClient.sendEmail(params).promise();

    console.log(result);

    return result;
  } catch (error) {
    console.error(error);
  }
}

export const handler = sendMail;
