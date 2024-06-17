"use client";
import { MantineProvider, useProps } from "@mantine/core";
import { SessionProvider } from "next-auth/react";

interface CustomComponentProps {
  color: string;
  children: React.ReactNode;
}

export const MantineProviders = ({ children, color }: CustomComponentProps) => {
  const location = window.location.origin.split(".")[0].split("//")[1];
  console.log(location);
  if (location === "zenn") {
    return <MantineProvider theme={{ primaryColor: "green" }}>{children}</MantineProvider>;
  }
  return <MantineProvider theme={{ primaryColor: color }}>{children}</MantineProvider>;
};
