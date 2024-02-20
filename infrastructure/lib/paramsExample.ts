import { IFrontendEnvironment } from "./constructs/common";
import { AuthStackProps } from "./auth-stack";
import { BackendProps } from "./constructs/backend";
import { FrontendProps } from "./constructs/frontend";
import { paramsFrontendEnvironment } from "./params";

export const paramsAuth: AuthStackProps = {
  domainPrefix: "{your-domain-prefix}",
  idPoolId: "ap-northeast-1:{id}",
  app1: {
    apigwId: "{apigw-id}",
    s3Bucket: "{s3-bucket-name}",
  },
};

export const paramsBackend: BackendProps = {
  servicePrefix: "zenn-nextjs-authjs-cognito",
  environment: "prod",
  ecr: {
    repositoryArn: "arn:aws:ecr:ap-northeast-1:{111122223333}:repository/zenn-example",
  },
  apigw: {
    certificate: `arn:aws:acm:us-east-1:{111122223333}:certificate/{id}`,
    route53DomainName: "{your.domain}",
    route53RecordName: `api.{zenn.your.domain}`,
    basePath: "v1",
  },
  cognito: {
    userPoolId: "ap-northeast-{id}",
    identityPoolId: "ap-northeast-1:{id}",
  },
  s3Bucket: "{s3-bucket-name}",
};

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

export const paramsFrontend: FrontendProps = {
  servicePrefix: "zenn-nextjs-authjs-cognito",
  environment: "prod",
  ecr: {
    repositoryArn: "arn:aws:ecr:ap-northeast-1:{111122223333}:repository/zenn-example",
  },
  apigw: {
    route53DomainName: "{your.domain}",
    route53RecordName: "*.{zenn.your.domain}",
  },
  lambda: {
    environment: paramsFrontendEnvironment,
  },
};

export const env = {
  account: "000011112222",
  region: "ap-northeast-1",
};
