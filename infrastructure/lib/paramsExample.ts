import { IBackend } from "./Backend";
import { ICognitoStack } from "./Cognito";

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

export const description = "zenn-nextjs-authjs-cognito@v0.1.0";
export const env = {
  account: "000011112222",
  region: "ap-northeast-1",
};
