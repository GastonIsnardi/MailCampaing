export const handler = async (event: APIGatewayProxyEvent) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, world!" }),
  };
};
