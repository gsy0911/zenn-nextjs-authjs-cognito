import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
} from "@mantine/core";
import { signIn } from "next-auth/react";
import { useForm } from "@mantine/form";

// see: https://ui.mantine.dev/category/authentication

export const SignInPage = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    // validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : "不正なメールアドレスです。",
      password: (value) =>
        value.length < 8
          ? "パスワードは8文字以上入力してください。"
          : !value.match(/[0-9]/)
          ? "数字を含めてください"
          : !value.match(/[a-z]/)
          ? "英語の小文字を含めてください"
          : !value.match(/[A-Z]/)
          ? "英語の大文字を含めてください"
          : !value.match(/[$&+,:;=?@#|'<>.^*()%!-]/)
          ? "記号を含めてください"
          : null,
    },
  });

  const onSubmit = () => {
    const username = form.values.email;
    const password = form.values.password;
    signIn("credentials", {
      username,
      password,
      redirect: true,
      callbackUrl: "/",
    });
  };

  return (
    <Container size={420} my={40}>
      <Title
        align="center"
        sx={(theme) => ({
          fontFamily: `Greycliff CF, ${theme.fontFamily}`,
          fontWeight: 900,
        })}
      >
        Welcome back!
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Do not have an account yet?{" "}
        <Anchor size="sm" component="button">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            required
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <Group position="apart" mt="lg">
            <Checkbox label="Remember me" />
            <Anchor component="button" size="sm">
              Forgot password?
            </Anchor>
          </Group>
          <Button fullWidth mt="xl" type={"submit"}>
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
};
