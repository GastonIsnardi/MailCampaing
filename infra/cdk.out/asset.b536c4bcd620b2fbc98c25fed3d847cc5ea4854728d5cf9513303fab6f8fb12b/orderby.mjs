import groupBy from "./groupBy.mjs";
const orderBy = (emails) => {
  return {
    body: {
      email: groupBy(emails, "body.destinatario", ["body"]),
      fecha: groupBy(emails, "body.receivedAt", ["body"]),
    },
    estado: groupBy(emails, "estado"),
  };
};

export default orderBy;
