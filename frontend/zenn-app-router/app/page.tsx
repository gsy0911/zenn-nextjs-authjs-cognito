"use client";
import { SignInPage } from "@/app/_components/signin";
import { UserInfo } from "@/app/_components/userInfo";
import { LoadingOverlay } from "@mantine/core";
import { useSession } from "next-auth/react";
import { MantineProviders } from "@/app/providers";

export default function Home() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <>
        <LoadingOverlay visible={true} />
      </>
    );
  }
  if (status === "unauthenticated") {
    return (
      <MantineProviders color={"red"}>
        <SignInPage />
      </MantineProviders>
    );
  }
  return <UserInfo />;
}
