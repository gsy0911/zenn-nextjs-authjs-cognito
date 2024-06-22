import { setup, assign } from "xstate";

type SignUpFlowContext = {
  signUpState: string | null;
  confirmState: string | null;
};

type SignUpEvent = { type: "signUp"; signUpState: string | null };
type ConfirmViaEmailEvent = { type: "confirmViaEmail"; confirmState: string | null };
type ResetPasswordEvent = { type: "resetPassword" };

type SignUpFlowEvent = SignUpEvent | ConfirmViaEmailEvent | ResetPasswordEvent;

// 現状は assign 関数のジェネリクスに型引数を5つ渡さないとちゃんと型補完が効かなさそうです。
const signUpAction = assign<SignUpFlowContext, SignUpEvent, any, SignUpFlowEvent, any>({
  signUpState: ({ event }) => event.signUpState,
});

const confirmAction = assign<SignUpFlowContext, ConfirmViaEmailEvent, any, SignUpFlowEvent, any>({
  confirmState: ({ event }) => event.confirmState,
});

export const signUpFlowMachine = setup({
  types: {
    context: {} as SignUpFlowContext,
    events: {} as SignUpFlowEvent,
  },
}).createMachine({
  id: "signUpMachine",
  initial: "initial",
  context: {
    signUpState: null,
    confirmState: null,
  },
  states: {
    /**
     * 例えば initial(初期表示) 状態のときに signUp(=SignUpEventで定義している`type`) イベントが発生した場合、registered 状態に遷移する
     **/
    initial: {
      on: {
        signUp: [
          {
            target: "registered",
            guard: ({ event }) => event.signUpState === "Success",
          },
          {
            target: "signUpError",
            actions: [signUpAction],
          },
        ],
      },
    },
    registered: {
      on: {
        confirmViaEmail: [{
          target: "confirmed",
          guard: ({ event }) => event.confirmState === "Success",
        },
        {
          target: "registered",
          actions: [confirmAction]
        }]
      },
    },
    confirmed: {},
    signUpError: {},
  },
});
