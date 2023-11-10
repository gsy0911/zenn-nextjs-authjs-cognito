export const prefix = "zenn-example";

export interface IFrontendEnvironment {
  ACCOUNT_ID: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  COGNITO_ISSUER: `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_${string}`;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  COGNITO_REGION: "ap-northeast-1";
  COGNITO_USER_POOL_ID: `ap-northeast-1_${string}`;
  COGNITO_IDENTITY_POOL_ID: `ap-northeast-1:${string}`;
}

export const ssmParameterEdgeName = (params: {
  cfType: "viewer-request" | "origin-request" | "origin-response";
  id: string;
}): string => {
  return `/${prefix}/lambda-edge/${params.cfType}/${params.id}`;
};
