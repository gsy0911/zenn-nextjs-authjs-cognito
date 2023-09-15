import { SignInPage } from "@/components/pages/signin";
import { LoadingOverlay, Button } from "@mantine/core";
import { useSession, signOut } from "next-auth/react";

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
      <>
        <SignInPage />
      </>
    );
  }
  return (
    <>
      {JSON.stringify(session)}
      <Button onClick={() => signOut()}>サインアウト</Button>
    </>
  );
}
