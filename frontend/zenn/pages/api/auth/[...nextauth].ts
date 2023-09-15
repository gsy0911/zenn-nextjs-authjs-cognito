import NextAuth, { Session, AuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import CognitoProvider from "next-auth/providers/cognito";
import CredentialsProvider from "next-auth/providers/credentials";
import { Issuer } from "openid-client";
import * as crypto from "crypto";
import {
  AdminInitiateAuthCommandInput,
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import jwt_decode from "jwt-decode";

export const get_jwt_decoded = (
  token: string,
): {
  [name: string]: string;
} => {
  return jwt_decode<{ [name: string]: string }>(token);
};

const cognitoProvider = CognitoProvider({
  id: "cognito",
  clientId: process.env.COGNITO_CLIENT_ID,
  clientSecret: process.env.COGNITO_CLIENT_SECRET,
  issuer: process.env.COGNITO_ISSUER,
  checks: "nonce",
});

async function refreshAccessToken(token: any): Promise<JWT> {
  try {
    const client_id = cognitoProvider.options?.clientId ?? "";
    const client_secret = cognitoProvider.options?.clientSecret ?? "";
    const issuer = await Issuer.discover(cognitoProvider.wellKnown!);
    const token_endpoint = issuer.metadata.token_endpoint ?? "";
    const basicAuthParams = `${client_id}:${client_secret}`;
    const basicAuth = Buffer.from(basicAuthParams).toString("base64");
    const params = new URLSearchParams({
      client_id,
      client_secret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });
    // Refresh token
    const response = await fetch(token_endpoint, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      method: "POST",
      body: params.toString(),
    });
    const newTokens = await response.json();
    console.log(`newTokens: ${JSON.stringify(newTokens)}`);
    if (!response.ok) {
      throw newTokens;
    }
    // Next expiration period
    const accessTokenExpires =
      Math.floor(Date.now() / 1000) + newTokens.expires_in;
    console.debug(`Token refreshed (expires at: ${accessTokenExpires})`);
    // Return new token set
    return {
      ...token,
      error: undefined,
      accessToken: newTokens.access_token,
      accessTokenExpires,
      idToken: newTokens.id_token,
    };
  } catch (error) {
    console.log(error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const signIn = async (username: string, password: string) => {
  const client = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION,
  });
  const secretHash = crypto
    .createHmac("sha256", process.env.COGNITO_CLIENT_SECRET)
    .update(username + process.env.COGNITO_CLIENT_ID)
    .digest("base64");
  try {
    const adminInput: AdminInitiateAuthCommandInput = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    };

    const user = await client.send(new AdminInitiateAuthCommand(adminInput));
    const expiresIn = user.AuthenticationResult?.ExpiresIn || 3600;
    const accessTokenExpires = Math.floor(Date.now() / 1000) + expiresIn;
    if (user.AuthenticationResult?.IdToken) {
      const decodedIdToken = get_jwt_decoded(
        user.AuthenticationResult?.IdToken,
      );
      return {
        id: decodedIdToken.sub || "",
        name: decodedIdToken.email || "",
        email: decodedIdToken.email || "",
        idToken: user.AuthenticationResult?.IdToken,
        refreshToken: user.AuthenticationResult?.RefreshToken,
        accessToken: user.AuthenticationResult?.AccessToken,
        accessTokenExpires: accessTokenExpires,
      };
    }
  } catch (err) {
    console.log(JSON.stringify(err));
  }
};

export const authOptions: AuthOptions = {
  providers: [
    // usernameでのサインイン
    CredentialsProvider({
      credentials: {
        username: {
          label: "ユーザー名",
          type: "text",
          placeholder: "ユーザー名",
        },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials, req) => {
        const user = await signIn(
          credentials?.username || "",
          credentials?.password || "",
        );

        if (user) {
          // 返されたオブジェクトはすべて、JWTの `user` プロパティに保存されます。
          return user;
        } else {
          // もし、NULLを返した場合は、ユーザーに詳細を確認するよう促すエラーが表示されます。
          return null;
          // また、このコールバックをエラーで拒否することもできます。この場合、ユーザーはエラーメッセージをクエリパラメータとして持つエラーページに送られます。
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      // Sign out from OAuth provider (Cognito)
      // call `signOut({ callbackUrl: "signOut" });` then this callback called
      // https://github.com/nextauthjs/next-auth/discussions/3938#discussioncomment-2231398
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("signOut:") && process.env.COGNITO_ENDPOINT) {
        // Sign out from auth provider
        const logoutEndpointUrl = `${process.env.COGNITO_ENDPOINT}/logout`;
        const campaign = url.split(":")[1];
        const params = new URLSearchParams({
          client_id: process.env.COGNITO_CLIENT_ID,
          logout_uri: `${process.env.NEXTAUTH_URL}/${campaign}/auth/login`,
        });
        return `${logoutEndpointUrl}?${params.toString()}`;
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      // Redirect to root when the redirect URL is still an external domain
      return baseUrl;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
      user: User;
    }): Promise<Session> {
      if (token.idToken) {
        session.user.idToken = token.idToken;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Credentialsサインインの場合: userに情報が付与されている
      if (account && user) {
        console.log(`user: ${JSON.stringify(user)}`);
        console.log(`account: ${JSON.stringify(account)}`);
        token.idToken = account.id_token || user.idToken;
        token.accessToken = account.access_token || user.accessToken;
        token.accessTokenExpires =
          account.expires_at || user.accessTokenExpires;
        token.refreshToken = account.refresh_token || user.refreshToken;
        return token;
      }
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires ?? 0) * 1000) {
        console.debug(
          `Token available (expires at: ${token.accessTokenExpires})`,
        );
        return token;
      }
      console.debug(`Token expired at ${token.accessTokenExpires}`);
      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
  },
};

export default NextAuth(authOptions);
