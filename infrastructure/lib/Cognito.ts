import {
  Duration,
  Stack,
  StackProps,
  RemovalPolicy,
  aws_cognito,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { prefix } from "./constants";

interface ICognitoStack {
  domainPrefix: string;
  callbackUrls: string[];
  logoutUrls: string[];
}
export const paramsCognito: ICognitoStack = {
  domainPrefix: "{your-domain-prefix}",
  callbackUrls: ["http://localhost:3000"],
  logoutUrls: ["http://localhost:3000"],
};

export class Cognito extends Stack {
  constructor(
    scope: Construct,
    id: string,
    params: ICognitoStack,
    props?: StackProps,
  ) {
    super(scope, id, props);

    /** USER POOL */
    const userPool = new aws_cognito.UserPool(this, "user-pool", {
      userPoolName: `${prefix}-user-pool`,
      // sign-up
      selfSignUpEnabled: false,
      // sign-in
      signInAliases: {
        username: true,
        email: true,
      },
      // user attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      mfa: aws_cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3),
      },
      // emails, by default `no-reply@verificationemail.com` used
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // App Clients
    userPool.addClient("private-client", {
      userPoolClientName: "private-client",
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        callbackUrls: params.callbackUrls,
        logoutUrls: params.logoutUrls,
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.EMAIL],
      },
    });

    userPool.addDomain("cognito-domain", {
      cognitoDomain: {
        domainPrefix: params.domainPrefix,
      },
    });
  }
}
