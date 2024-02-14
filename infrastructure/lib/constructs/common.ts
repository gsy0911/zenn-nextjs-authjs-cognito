export type environment = "feature" | "dev" | "prod";

export interface IFrontendEnvironment {
  ACCOUNT_ID: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  AUTH_TRUST_HOST?: string;
  BACKEND_API_ENDPOINT: string;
  COGNITO_ISSUER: `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_${string}`;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  COGNITO_REGION: "ap-northeast-1";
  COGNITO_USER_POOL_ID: `ap-northeast-1_${string}`;
  COGNITO_IDENTITY_POOL_ID: `ap-northeast-1:${string}`;
}
