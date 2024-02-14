import { IFrontendEnvironment } from "./constructs/common";

export const frontendEnvironment: {
  [key: string]: string;
} & IFrontendEnvironment = {
  ACCOUNT_ID: "",
  NEXT_PUBLIC_GOOGLE_MAP_KEY: "none",
  NEXTAUTH_SECRET: "none",
  NEXTAUTH_URL: "",
  COGNITO_REGION: "ap-northeast-1",
  COGNITO_USER_POOL_ID: "ap-northeast-1_none",
  COGNITO_IDENTITY_POOL_ID: "ap-northeast-1:none",
  BACKEND_API_ENDPOINT: "",
  BACKEND_API_KEY: "none",
  COGNITO_ISSUER: `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_none`,
  COGNITO_CLIENT_ID: "none",
  COGNITO_CLIENT_SECRET: "none",
};

export const env = {
  account: "000011112222",
  region: "ap-northeast-1",
};
