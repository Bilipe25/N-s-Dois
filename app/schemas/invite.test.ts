import { describe, expect, it } from "vitest";
import { CreateInviteLinkActionSchema, RotateInviteLinkActionSchema } from "./invite";

const guestId = "11111111-1111-4111-8111-111111111111";

describe("invite link actions", () => {
  it("permite criar o primeiro link sem confirmação de rotação", () => {
    expect(CreateInviteLinkActionSchema.safeParse({ intent: "create_invite_link", id: guestId }).success).toBe(true);
  });

  it("exige confirmação explícita para rotacionar um link", () => {
    expect(RotateInviteLinkActionSchema.safeParse({ intent: "rotate_invite_link", id: guestId }).success).toBe(false);
    expect(RotateInviteLinkActionSchema.safeParse({ intent: "rotate_invite_link", id: guestId, confirmed: false }).success).toBe(false);
    expect(RotateInviteLinkActionSchema.safeParse({ intent: "rotate_invite_link", id: guestId, confirmed: true }).success).toBe(true);
  });
});
