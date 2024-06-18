"use server";
import { cognitoSignUp, cognitoConfirmSignUp } from "@/common/api/cognito";
import { UsernameExistsException } from "@aws-sdk/client-cognito-identity-provider";
import { redirect } from "next/navigation";

interface OnAuthSignUpRequest {
  email: string;
  password: string;
}

export const onCognitoSignUp = async (_: string | null, formData: OnAuthSignUpRequest) => {
  const { email, password } = formData;

  try {
    const commandResponse = await cognitoSignUp({ email, password });
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
  await cognitoConfirmSignUp({ email, confirmationCode });

  redirect("/sign-up/complete");
};
