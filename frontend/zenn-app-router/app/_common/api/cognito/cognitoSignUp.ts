"use server";

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  type SignUpCommandInput,
  type SignUpCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { genSecretHash } from "./utils";

interface CognitoAuthSignUpProps {
  email: string;
  password: string;
}

export const cognitoSignUp = async (props: CognitoAuthSignUpProps): Promise<SignUpCommandOutput> => {
  const { email, password } = props;
  const { secretHash } = genSecretHash({ email });

  const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
  });
  const signUpCommandInput: SignUpCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    SecretHash: secretHash,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
    ],
  };
  const command = new SignUpCommand(signUpCommandInput);
  return await client.send(command);
};
