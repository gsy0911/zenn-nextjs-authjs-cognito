import crypto from "crypto";

export const genSecretHash = ({ email }: { email: string }) => {
  const secretHash = crypto
    .createHmac("sha256", process.env.COGNITO_CLIENT_SECRET)
    .update(email + process.env.COGNITO_CLIENT_ID)
    .digest("base64");
  return { secretHash };
};
