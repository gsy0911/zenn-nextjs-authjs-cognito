import {
  Avatar,
  Text,
  Button,
  Paper,
  Container,
  LoadingOverlay,
  Space,
  Group,
  Divider,
} from "@mantine/core";
import axios from "axios";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

export const UserInfo = () => {
  const { data: session } = useSession();
  const [message, setMessage] = useState<string>("");
  if (!session) {
    return <LoadingOverlay visible={true} />;
  }

  const onAdminClick = () => {
    axios({
      url: "/api/v1/admin",
      method: "GET",
      headers: { Authorization: session.user.idToken },
    })
      .then((res) => {
        setMessage(JSON.stringify(res));
      })
      .catch((err) => {
        setMessage(JSON.stringify(err));
      });
  };
  const onUserClick = () => {
    axios({
      url: "/api/v1/user",
      method: "GET",
      headers: { Authorization: session.user.idToken },
    })
      .then((res) => {
        setMessage(JSON.stringify(res));
      })
      .catch((err) => {
        setMessage(JSON.stringify(err));
      });
  };

  // ref: https://ui.mantine.dev/category/users/
  return (
    <Container size={"md"}>
      <Space h={"xl"} />
      <Paper radius="md" withBorder p="lg" bg="var(--mantine-color-body)">
        <Avatar
          src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=255&q=80"
          size={120}
          radius={120}
          mx="auto"
        />
        <Text ta="center" fz="lg" fw={500} mt="md">
          {session.user.email}
        </Text>
        <Text mt="md" color={"dimmed"}>
          {session.user.idToken}
        </Text>

        <Button onClick={() => signOut()} fullWidth mt={"md"}>
          サインアウト
        </Button>
        <Space h={"md"} />
        <Group grow position={"center"}>
          <Button onClick={onAdminClick}>admin</Button>
          <Button onClick={onUserClick}>user</Button>
        </Group>
        <Space h={"md"} />
        <Divider
          label={"response"}
          labelPosition={"center"}
          variant={"dashed"}
        />
        {message}
      </Paper>
    </Container>
  );
};
