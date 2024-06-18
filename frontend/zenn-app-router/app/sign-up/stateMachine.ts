import { setup, assign } from "xstate";

type SignUpFlowContext = {
  applicationContent?: string; // 申請内容
};

type SignUpEvent = { type: "signUp" }; // 作成者が提出。申請内容を含む。
type ConfirmViaEmailEvent = { type: "confirmViaEmail" }; // 承認者が承認
type ResetPasswordEvent = { type: "resetPassword" }; // 承認者が差し戻し

type SignUpFlowEvent = SignUpEvent | ConfirmViaEmailEvent | ResetPasswordEvent;

// 現状は assign 関数のジェネリクスに型引数を5つ渡さないとちゃんと型補完が効かなさそうです。
// const submitAction = assign<
//   ApprovalFlowContext,
//   SubmitEvent,
//   any,
//   ApprovalFlowEvent,
//   any
// >({
//   applicationContent: ({ context, event }) => event.content,
// })
//
// const resubmitAction = assign<
//   ApprovalFlowContext,
//   ResubmitEvent,
//   any,
//   ApprovalFlowEvent,
//   any
// >({
//   applicationContent: ({ context, event }) => event.content,
// })

export const signUpFlowMachine = setup({
  types: {
    context: {} as SignUpFlowContext,
    events: {} as SignUpFlowEvent,
  },
}).createMachine({
  id: "signUpMachine",
  initial: "initial",
  context: {
    applicationContent: "",
  },
  states: {
    /**
     * 例えば draft 状態のときに submit イベントが発生した場合、pending 状態に遷移し、
     * 状態遷移の際に submitAction 関数を実行する、という読み方ができます。
     **/
    initial: {
      on: {
        signUp: {
          target: "registered",
        },
      },
    },
    registered: {
      on: {
        confirmViaEmail: {
          target: "confirmed",
        },
      },
    },
    confirmed: {},
    forceChangePassword: {
      on: {
        resetPassword: {
          target: "confirmed",
        },
      },
    },
  },
});
