import { Duration, RemovalPolicy, aws_cognito } from "aws-cdk-lib";
import { Construct } from "constructs";
import { environment } from "./common";

interface AuthProps {
  environment: environment;
  servicePrefix: string;
  domainPrefix: string;
}

export class Authentication extends Construct {
  readonly userPool: aws_cognito.UserPool;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    const { servicePrefix, environment } = props;
    const userPool = new aws_cognito.UserPool(this, "UserPool", {
      userPoolName: `${servicePrefix}-user-pool-${environment}`,
      // signUp
      // By default, self sign up is disabled. Otherwise use userInvitation
      selfSignUpEnabled: false,
      userVerification: {
        emailSubject: "Verify email message",
        emailBody: "Thanks for signing up! Your verification code is {####}",
        emailStyle: aws_cognito.VerificationEmailStyle.CODE,
        smsMessage: "Thanks for signing up! Your verification code is {####}",
      },
      // sign in
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
      // role, specify if you want
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

    userPool.addDomain("CognitoDomain", {
      cognitoDomain: {
        domainPrefix: props.domainPrefix,
      },
    });

    this.userPool = userPool;
  }
}
