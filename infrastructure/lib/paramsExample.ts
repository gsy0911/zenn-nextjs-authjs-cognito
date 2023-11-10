import { IBackend } from "./Backend";
import { ICognitoStack } from "./Cognito";
import { IFrontendEnvironment } from "./constants";

export const paramsCognito: ICognitoStack = {
  domainPrefix: "{your.domain.com}",
  callbackUrls: ["http://localhost:3000"],
  logoutUrls: ["http://localhost:3000"],
  idPool: {
    apigwRestApiId: "aaaabbbbcc",
    // 最初は空でデプロイ後に取得できる値から設定する。
    idPoolId: "ap-northeast-1:aaaabbbb-cccc-dddd-eeee-ffffgggghhhh",
  },
  s3Bucket: "your-bucket-name",
};

export const paramsBackend: IBackend = {
  name: "ZennExampleApi",
  ecr: {
    repositoryArn:
      "arn:aws:ecr:ap-northeast-1:000011112222:repository/zenn-example",
  },
  apigw: {
    certificate: `arn:aws:acm:us-east-1:000011112222:certificate/aaaabbbb-cccc-dddd-eeee-ffffgggghhhh`,
    route53DomainName: "your.domain",
    route53RecordName: `api.zenn.your.domain`,
    basePath: "v1",
  },
  cognito: {
    userPoolId: "ap-northeast-1_aaaabbbb",
    identityPoolId: "ap-northeast-1:aaaabbbb-cccc-dddd-eeee-ffffgggghhhh",
  },
  s3Bucket: "your-bucket-name",
};

export const stgFrontendEnvironment: {
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

export const description = "zenn-nextjs-authjs-cognito@v0.1.0";
export const env = {
  account: "000011112222",
  region: "ap-northeast-1",
};
export const envUsEast = {
  account: "000011112222",
  region: "us-east-1",
};
