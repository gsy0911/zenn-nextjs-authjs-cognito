"use client";
import { useEffect } from "react";
import {
  Center,
  TextInput,
  PasswordInput,
  Checkbox,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Anchor,
} from "@mantine/core";
import { useFormState } from "react-dom";
import { useForm } from "@mantine/form";
import { onCognitoSignUp, onCognitoConfirmSignUp } from "./actions";
import { useMachine } from "@xstate/react";
import { createBrowserInspector } from "@statelyai/inspect";
import { signUpFlowMachine } from "./stateMachine";

const { inspect } = createBrowserInspector();
// see: https://ui.mantine.dev/category/authentication

export const SignUpXState = () => {
  // 第二引数に inspect 関数を渡すことで、ブラウザ上でステートマシーンを GUI で表示できます。
  const [current, send] = useMachine(signUpFlowMachine, { inspect });
  const [signUpState, signUpAction] = useFormState(onCognitoSignUp, null);
  const [confirmState, confirmAction] = useFormState(onCognitoConfirmSignUp, null);

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      check: false,
      confirmationCode: "",
    },
    // validateInputOnChange: true,
    validateInputOnBlur: true,
    validate: (values) => {
      if (current.matches("initial")) {
        return {
          email: /^\S+@\S+$/.test(values.email) ? null : "不正なメールアドレスです。",
          password:
            values.password.length < 8
              ? "パスワードは8文字以上入力してください。"
              : !values.password.match(/[0-9]/)
                ? "数字を含めてください"
                : !values.password.match(/[a-z]/)
                  ? "英語の小文字を含めてください"
                  : !values.password.match(/[A-Z]/)
                    ? "英語の大文字を含めてください"
                    : !values.password.match(/[$&+,:;=?@#|'<>.^*()%!-]/)
                      ? "記号を含めてください"
                      : null,
          check: !values.check ? "同意が必要です" : null,
        };
      } else if (current.matches("registered")) {
        return {
          confirmationCode: values.confirmationCode === "" ? "入力は必須です" : values.confirmationCode.length !== 6 ? "コードの長さが違います。" : null,
        };
      }

      return {};
    },
  });

  useEffect(() => {
    const updateSignUpState = () => {
      if (signUpState) {
        send({ type: "signUp", signUpState });
      }
    };
    updateSignUpState();
  }, [signUpState]);

  useEffect(() => {
    const updateConfirmationState = () => {
      if (confirmState) {
        send({ type: "confirmViaEmail", confirmState });
      }
    };
    updateConfirmationState();
  }, [confirmState]);

  const onSignUp = () => {
    signUpAction({
      email: form.values.email,
      password: form.values.password,
    });
  };

  const onConfirmViaEmail = () => {
    confirmAction({
      email: form.values.email,
      confirmationCode: form.values.confirmationCode,
    });
    form.setValues({confirmationCode: ""});
  };

  return (
    <Container size={420} my={40}>
      {current.matches("initial") && (
        <>
          <Center>
            <Title c={"#333"}>Welcome!</Title>
          </Center>
          <Center>
            <Text c={"dimmed"} size={"sm"} mt={5}>
              You are to create an account, or{" "}
              <Anchor size="sm" href={"/"}>
                Already have an account
              </Anchor>
            </Text>
          </Center>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput label="Email" placeholder="you@mantine.dev" required {...form.getInputProps("email")} />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              {...form.getInputProps("password")}
            />
            <Group justify={"space-between"} mt="lg">
              <Checkbox label="利用規約に同意する" {...form.getInputProps("check")} />
            </Group>
            <Button fullWidth mt="xl" onClick={onSignUp} disabled={!form.isValid()}>
              Sign up
            </Button>
          </Paper>
        </>
      )}

      {current.matches("signUpError") && (
        <>
          <Center>
            <Title c={"#333"}>SignUp Error!</Title>
          </Center>
          <Center>
            <Text c={"dimmed"} size={"sm"} mt={5}>
              {current.context.signUpState}.{" "}
              <Anchor size="sm" href={"/"}>
                try again.
              </Anchor>
            </Text>
          </Center>
        </>
      )}

      {current.matches("registered") && (
        <>
          <Center>
            <Title c={"#333"}>Confirm now!</Title>
          </Center>
          <Center>
            <Text c={"dimmed"} size={"sm"} mt={5}>
              Set up is almost complete
            </Text>
          </Center>

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput
              label="Confirmation code"
              placeholder="000111"
              required
              {...form.getInputProps("confirmationCode")}
            />
            <Text c={"red"} size={"xs"}>
              {current.context.confirmState === "CodeMismatchException" && form.values.confirmationCode === "" && (
                <>コードが一致しません</>
              )}
            </Text>

            <Button fullWidth mt="xl" onClick={onConfirmViaEmail} disabled={!form.isValid()}>
              Confirm
            </Button>
          </Paper>
        </>
      )}

      {current.matches("confirmed") && (
        <>
          <Center>
            <Title c={"#333"}>Sign Up Complete!</Title>
          </Center>
          <Center>
            <Text c={"dimmed"} size={"sm"} mt={5}>
              Welcome to our Site.
            </Text>
          </Center>
          <Button fullWidth mt="xl" component={"a"} href={"/"}>
            Back home to Sign-in
          </Button>
        </>
      )}
    </Container>
  );
};
