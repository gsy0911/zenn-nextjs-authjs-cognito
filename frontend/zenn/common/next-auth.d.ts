import { NextPage } from "next";
import { DefaultSession } from "next-auth";

interface UserWithId extends DefaultSession["user"] {
  idToken?: string;
  id?: string;
  email: string;
}

declare module "next-auth/jwt" {
  interface JWT {
    idToken?: string;
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: UserWithId;
    error?: string;
  }

  interface User {
    idToken?: string;
    refreshToken?: string;
    accessToken?: string;
    accessTokenExpires?: number;
  }

  interface Account {
    expires_at;
  }
}

// 各種ページに認証を付与するかどうかの変数追加
export type CustomNextPage<P = {}, IP = P> = NextPage<P, IP> & {
  requireAuth?: boolean;
};
