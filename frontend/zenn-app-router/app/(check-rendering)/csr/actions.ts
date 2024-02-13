"use server";
import { FormEvent } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/authOptions";
import axios from "axios";
import {
  GetIdCommandInput,
  GetIdCommand,
  GetCredentialsForIdentityCommandInput,
  GetCredentialsForIdentityCommandOutput,
  GetCredentialsForIdentityCommand,
  CognitoIdentityClient,
} from "@aws-sdk/client-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { QueryParameterBag } from "@aws-sdk/types";
import { Sha256 } from "@aws-crypto/sha256-universal";
import { createFormActions } from "@mantine/form";

interface ServerRequest {
  message: string | null;
}

interface ServerResponse {
  message: string | null;
  data: { [key: string]: string } | null;
}

const getCredentialsFromIdToken = async (
  idToken: string,
): Promise<GetCredentialsForIdentityCommandOutput> => {
  const client = new CognitoIdentityClient({
    region: process.env.COGNITO_REGION,
  });
  const loginsKey = `cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
  const getIdCommandInput: GetIdCommandInput = {
    AccountId: process.env.ACCOUNT_ID,
    IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
    Logins: { [loginsKey]: idToken },
  };
  const identityId = await client.send(new GetIdCommand(getIdCommandInput));

  const getCredentialsForIdentityCommandInput: GetCredentialsForIdentityCommandInput =
    {
      IdentityId: identityId.IdentityId,
      Logins: { [loginsKey]: idToken },
    };
  return await client.send(
    new GetCredentialsForIdentityCommand(getCredentialsForIdentityCommandInput),
  );
};

const getSignedHeaders = async (
  credentials: GetCredentialsForIdentityCommandOutput,
  apiUrl: URL,
  query?: QueryParameterBag,
) => {
  const signatureV4 = new SignatureV4({
    service: "execute-api",
    region: process.env.COGNITO_REGION,
    credentials: {
      accessKeyId: credentials.Credentials?.AccessKeyId || "",
      secretAccessKey: credentials.Credentials?.SecretKey || "",
      sessionToken: credentials.Credentials?.SessionToken || "",
    },
    sha256: Sha256,
  });
  console.log(`${apiUrl.hostname}, ${apiUrl.pathname}`);
  const httpRequest = new HttpRequest({
    headers: {
      "content-type": "application/json",
      host: apiUrl.hostname,
    },
    hostname: apiUrl.hostname,
    method: "GET",
    path: apiUrl.pathname,
    query,
  });
  const signedRequest = await signatureV4.sign(httpRequest);
  return signedRequest.headers;
};


export const onAdminClick = async (_: ServerResponse, fd: ServerRequest): Promise<ServerResponse> => {
  const session = await getServerSession(authOptions);
  const credentials = await getCredentialsFromIdToken(
    session?.user?.idToken || "",
  );
  const signedHeaders = await getSignedHeaders(
    credentials,
    new URL(`${process.env.BACKEND_API_ENDPOINT}/v1/admin`),
    {},
  );
  console.log(`fd: ${JSON.stringify(fd)}`)
  // console.log(`fd.message: ${JSON.stringify(fd.get("message"))}`)
  console.log(`fd.message: ${JSON.stringify(fd.message)}`)
  return axios({
    url: `${process.env.BACKEND_API_ENDPOINT}/v1/admin`,
    method: "GET",
    headers: { idToken: session?.user?.idToken || "", ...signedHeaders },
  })
    .then((res) => {
      console.log(`success: ${JSON.stringify(res.data)}`);
      return { message: "success", data: res.data };
    })
    .catch((err) => {
      console.log(`fail: ${JSON.stringify(err)}`);
      return { message: "fail", data: null };
    });
};
