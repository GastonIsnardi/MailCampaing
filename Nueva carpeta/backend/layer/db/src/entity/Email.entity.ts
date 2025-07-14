import { Entity } from "electrodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk-core";

const client = captureAWSv3Client(new DynamoDBClient({ region: "us-east-1" }));

export const EmailMainEntity = new Entity(
  {
    model: {
      entity: "EmailMain",
      version: "1",
      service: "EnersaMailings",
    },
    attributes: {
      id: { type: "string", required: true },
      status: { type: "string", required: true },
      tipo: { type: "string", required: true },
      destinatario: { type: "string", required: true },
      contentUrl: { type: "string" },
      contentUrlTerminos: { type: "string" },
      contentFechas: {
        type: "list",
        items: {
          type: "map",
          properties: {
            fecha: { type: "string" },
            nroCuota: { type: "string" },
          },
        },
      },
      contador: { type: "number", default: 0 },
      enviar: { type: "boolean", required: true },
      receivedAt: { type: "string" },
    },
    indexes: {
      byIdStatus: {
        pk: { field: "pk", composite: ["id"] },
        sk: { field: "sk", composite: ["tipo"] },
      },
      byDestinatario: {
        index: "GSI4",
        pk: { field: "destinatario", composite: ["destinatario"] },
        sk: { field: "tipo", composite: ["tipo"] },
      },
    },
  },
  {
    client,
    table: process.env.dynamoTable || "EnersaEmailTable",
  }
);

export const EmailLogEntity = new Entity(
  {
    model: {
      entity: "EmailLog",
      version: "1",
      service: "EnersaMailings",
    },
    attributes: {
      id: { type: "string", required: true },
      emailID: { type: "string", required: true },
      status: { type: "string", required: true },
      tipo: { type: "string", required: true },
      comentario: { type: "string" },
      receivedAt: { type: "string" },
    },
    indexes: {
      // 🔹 Sin sort key
      byIndex: {
        pk: { field: "pk", composite: ["emailID"] },
        sk: { field: "sk", composite: ["tipo"] },
      },
      byEmail: {
        index: "GSI1",
        pk: { field: "id", composite: ["id"] },
        sk: { field: "tipo", composite: ["tipo"] },
      },
      byEmailID: {
        index: "GSI2",
        pk: { field: "emailID", composite: ["emailID"] },
        sk: { field: "tipo", composite: ["tipo"] },
      },
      byEmailIDStatus: {
        index: "GSI3",
        pk: { field: "id", composite: ["id"] },
        sk: { field: "status", composite: ["status"] },
      },
    },
  },
  {
    client,
    table: process.env.dynamoTable || "EnersaEmailTable",
  }
);
