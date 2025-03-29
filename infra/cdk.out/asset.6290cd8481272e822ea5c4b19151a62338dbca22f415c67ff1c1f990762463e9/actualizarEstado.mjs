import { TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });

export const actualizarEstado = async (emailId, estadoAntiguo, estadoNuevo, body) => {
  const table = process.env.TABLENAME;

  const transactParams = {
    TransactItems: [
      {
        Delete: {
          TableName: table,
          Key: {
            emailId: { S: emailId },
            estado: { S: estadoAntiguo },
          },
        },
      },
      {
        Put: {
          TableName: table,
          Item: {
            emailId: { S: emailId },
            estado: { S: estadoNuevo },
            body: { S: body },
          },
        },
      },
    ],
  };

  const transactCommand = new TransactWriteItemsCommand(transactParams);
  await ddbClient.send(transactCommand);
};
