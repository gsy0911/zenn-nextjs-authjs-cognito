import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import { Authentication } from "./constructs/authentication";
import {
  Authorization,
  AuthorizationGroupAndRole,
} from "./constructs/authorization";

export interface AuthStackProps {
  domainPrefix: string;
  app1: {
    apigwId: string;
    s3Bucket: string;
    idPoolId: `ap-northeast-1:${string}`;
  };
}

export class AuthStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    params: AuthStackProps,
    props: StackProps,
  ) {
    super(scope, id, props);

    const { domainPrefix } = params;
    const servicePrefix = "zenn-nextjs-authjs-cognito";
    const environment = "prod";
    const accountId = Stack.of(this).account;

    // 1: 認証
    const authentication = new Authentication(this, "Authentication", {
      environment,
      servicePrefix,
      domainPrefix,
    });

    // アプリ1
    const app1AdminOnlyResource = (apigwRestApiId: string): string[] => {
      return [
        `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/admin`,
        `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/read-file`,
      ];
    };
    const app1UserOnlyResource = (apigwRestApiId: string): string[] => {
      return [
        `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/user`,
        `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/read-file`,
      ];
    };
    const app1Groups = new AuthorizationGroupAndRole(this, "App1", {
      environment,
      servicePrefix,
      userPool: authentication.userPool,
      callbackUrls: ["https://localhost:3000/api/auth/callback/cognito"],
      logoutUrls: ["https://localhost:3000"],
      idPool: {
        adminRoleResources: app1AdminOnlyResource(params.app1.apigwId),
        userRoleResources: app1UserOnlyResource(params.app1.apigwId),
        s3Bucket: params.app1.s3Bucket,
        idPoolId: params.app1.idPoolId,
      },
    });

    // 2: 認可
    new Authorization(this, "Authorization", {
      environment,
      servicePrefix,
      userPools: [app1Groups.userPool],
      roleMappings: [app1Groups.roleMapping],
    });
  }
}
