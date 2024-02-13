import { getServerSession } from "next-auth/next";
import { Title, List, ListItem } from "@mantine/core";
import { authOptions } from "@/app/authOptions";

interface IsrTodo {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

const IsrPage = async () => {
  const todo: IsrTodo = await getData();
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <>
      <Title order={1}>ISR</Title>
      <List>
        <ListItem> Id : {todo.id}</ListItem>
        <ListItem> userId : {todo.userId}</ListItem>
        <ListItem> title : {todo.title}</ListItem>
        <ListItem> completed : {todo.completed.toString()}</ListItem>
      </List>
      <Title order={3}>UserInfo</Title>
      <List>
        <ListItem> e-mail : {user?.email}</ListItem>
        <ListItem> idToken : {user?.idToken}</ListItem>
      </List>
    </>
  );
};

async function getData() {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos/1", {
    next: { revalidate: 3 },
  });
  return res.json();
}

export default IsrPage;
