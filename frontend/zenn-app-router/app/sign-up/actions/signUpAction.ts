"use server";
import { cognitoSignUp, cognitoConfirmSignUp } from "@/common/api/cognito";
import { UsernameExistsException, CodeMismatchException, ExpiredCodeException, InvalidParameterException } from "@aws-sdk/client-cognito-identity-provider";

interface OnAuthSignUpRequest {
  email: string;
  password: string;
}

export const onCognitoSignUp = async (_: string | null, formData: OnAuthSignUpRequest) => {
  const { email, password } = formData;

  try {
    await cognitoSignUp({ email, password });
  } catch (err) {
    console.log(err);
    if (err instanceof UsernameExistsException) {
      return "UsernameExistsException";
    }
    return "Unknown";
  }

  // エラーが発生しなかった場合、成功として画面に遷移する
  return "Success";
};

interface OnAuthConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export const onCognitoConfirmSignUp = async (_: string | null, formData: OnAuthConfirmSignUpRequest) => {
  const { email, confirmationCode } = formData;

  try {
    await cognitoConfirmSignUp({ email, confirmationCode });
  } catch (err) {
    if (err instanceof ExpiredCodeException) {
      return "ExpiredCodeException";
    } else if (err instanceof CodeMismatchException) {
      return "CodeMismatchException";
    } else if (err instanceof InvalidParameterException) {
      return "InvalidParameterException";
    }
    return "Unknown";
  }

  return "Success";
};
