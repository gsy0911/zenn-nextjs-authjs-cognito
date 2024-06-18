"use server";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  type ConfirmSignUpCommandInput,
  type ConfirmSignUpCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { genSecretHash } from "./utils";

interface OnAuthConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export const cognitoConfirmSignUp = async (props: OnAuthConfirmSignUpRequest): Promise<ConfirmSignUpCommandOutput> => {
  const { email, confirmationCode } = props;
  const { secretHash } = genSecretHash({ email });

  const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
  });
  const confirmSignUpCommandInput: ConfirmSignUpCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    SecretHash: secretHash,
    Username: email,
    ConfirmationCode: confirmationCode,
  };
  const command = new ConfirmSignUpCommand(confirmSignUpCommandInput);
  return await client.send(command);
};
