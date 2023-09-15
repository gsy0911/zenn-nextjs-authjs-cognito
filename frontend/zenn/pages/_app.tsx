import type { AppProps } from "next/app";
import { NextComponentType } from "next";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { MantineProvider } from "@mantine/core";

export type CustomAppProps = AppProps<{ session: Session }> & {
  Component: NextComponentType & { requireAuth?: boolean };
};

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: CustomAppProps) {
  return (
    <>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          /** Put your mantine theme override here */
          colorScheme: "light",
        }}
      >
        <SessionProvider session={session}>
          <Component {...pageProps} />
        </SessionProvider>
      </MantineProvider>
    </>
  );
}
