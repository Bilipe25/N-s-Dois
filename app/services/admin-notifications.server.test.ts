import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerAdminClient: vi.fn(),
  sendPushToUser: vi.fn(),
}));

vi.mock("@/lib/supabase.server", () => ({ createServerAdminClient: mocks.createServerAdminClient }));
vi.mock("@/services/push.server", () => ({ sendPushToUser: mocks.sendPushToUser }));

import {
  buildGiftNotification,
  buildRsvpNotification,
  notifyAdminsBestEffort,
} from "./admin-notifications.server";

function notificationClient(result: { data: { id: string } | null; error: { message: string } | null }) {
  const chain = {
    select: vi.fn(),
    single: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.single.mockResolvedValue(result);
  return { from: vi.fn(() => ({ insert: vi.fn(() => chain) })) };
}

describe("notificações administrativas da celebração", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerAdminClient.mockReturnValue(notificationClient({ data: { id: "11111111-1111-4111-8111-111111111111" }, error: null }));
    mocks.sendPushToUser.mockResolvedValue({ success: true });
  });

  it("gera mensagens ricas para confirmação, alteração, recusa e cadastro pelo site", () => {
    expect(buildRsvpNotification({ name: "Maria", status: "confirmado", adults: 2, children: 1 }).message)
      .toBe("2 adultos · 1 criança");
    expect(buildRsvpNotification({ name: "Maria", status: "confirmado", adults: 1, children: 0, changed: true }).title)
      .toBe("Maria alterou a confirmação");
    expect(buildRsvpNotification({ name: "João", status: "recusado", adults: 0, children: 0 }).message)
      .toBe("Não poderá estar presente.");
    expect(buildRsvpNotification({ name: "Ana", status: "confirmado", adults: 1, children: 0, publicRegistration: true }))
      .toMatchObject({ title: "Ana confirmou presença", message: expect.stringContaining("Nova pelo site") });
  });

  it("gera mensagens distintas para reserva e cancelamento", () => {
    expect(buildGiftNotification({ action: "reserved", guestName: "Maria", giftName: "Faqueiro" }).message)
      .toContain("Faqueiro");
    expect(buildGiftNotification({ action: "cancelled", guestName: "Maria", giftName: "Faqueiro" }).message)
      .toContain("disponível");
  });

  it("usa o id persistido como tag única do push", async () => {
    const request = new Request("https://example.com");
    const result = await notifyAdminsBestEffort({ request, type: "gift", title: "Título", message: "Mensagem", link: "/celebracao/admin" });
    expect(result).toEqual({ notificationId: "11111111-1111-4111-8111-111111111111", pushDelivered: true });
    expect(mocks.sendPushToUser).toHaveBeenCalledWith(
      request,
      "all",
      "Título",
      "Mensagem",
      "/celebracao/admin",
      undefined,
      "notification-11111111-1111-4111-8111-111111111111",
    );
  });

  it("não tenta push se a notificação interna falhar", async () => {
    mocks.createServerAdminClient.mockReturnValue(notificationClient({ data: null, error: { message: "offline" } }));
    const result = await notifyAdminsBestEffort({ request: new Request("https://example.com"), type: "rsvp", title: "Título", message: "Mensagem", link: "/guests" });
    expect(result).toEqual({ notificationId: null, pushDelivered: false });
    expect(mocks.sendPushToUser).not.toHaveBeenCalled();
  });

  it("preserva a notificação interna quando a entrega push falha", async () => {
    mocks.sendPushToUser.mockRejectedValueOnce(new Error("push offline"));
    const result = await notifyAdminsBestEffort({ request: new Request("https://example.com"), type: "rsvp", title: "Título", message: "Mensagem", link: "/guests" });
    expect(result).toEqual({ notificationId: "11111111-1111-4111-8111-111111111111", pushDelivered: false });
  });
});
