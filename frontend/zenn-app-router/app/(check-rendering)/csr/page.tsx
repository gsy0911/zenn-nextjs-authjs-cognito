"use client";
import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { Title, List, ListItem, Button, Divider, Group, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { NextAuthProviders } from "@/app/providers";
import { useSession } from "next-auth/react";
import { onAdminClick } from "./actions";
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/authOptions";
// import axios from "axios";

interface CsrTodo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

const CsrPage = () => {
  const [todo, setData] = useState<CsrTodo | null>(null);
  const [adminState, adminAction] = useFormState(onAdminClick, {
    message: null,
    data: null,
  });
  const [message, setMessage] = useState("");
  const { data: session } = useSession();
  const user = session?.user;
  const form = useForm({
      initialValues: {
          message: ""
      }
  })

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/todos/1",
    );
    const todo: CsrTodo = await response.json();
    setData(todo);
  };

  const onFormSubmit = () => {
      console.log("")
      adminAction({message: "hello"})
  }

  return (
    <NextAuthProviders>
      <Title order={1}>CSR</Title>
      <List>
        <List.Item> Id : {todo?.id}</List.Item>
        <List.Item> userId : {todo?.userId}</List.Item>
        <List.Item> title : {todo?.title}</List.Item>
        <List.Item> completed : {todo?.completed.toString()}</List.Item>
      </List>
      <Title order={3}>UserInfo</Title>
      <List>
        <ListItem> e-mail : {user?.email}</ListItem>
        <ListItem> idToken : {user?.idToken}</ListItem>
        <ListItem> origin : {user?.origin}</ListItem>
      </List>
      <Divider
        label={"authorization-check: API Gateway"}
        labelPosition={"center"}
        variant={"dashed"}
      />

      <Group grow>
        <form onSubmit={form.onSubmit(adminAction)}>
            <TextInput
                type={"text"}
                placeholder={"hello, world"}
                label={"message"}
                withAsterisk
                // name={"message"}
                // value={message}
                // onChange={e => setMessage(e.target.value)}
                {...form.getInputProps("message")}
            />
          <Button type="submit">/admin</Button>
        </form>
        {/*<Button onClick={onAdminClick}>/admin</Button>*/}
        {/*<Button onClick={onUserClick}>/user</Button>*/}
        {JSON.stringify(adminState.data)}
      </Group>
    </NextAuthProviders>
  );
};

export default CsrPage;
