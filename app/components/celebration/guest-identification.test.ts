import { describe, expect, it } from "vitest";
import { publicIdentificationStep } from "@/lib/guest-identification-state";

describe("fluxo público de identificação", () => {
  it("leva um nome inexistente diretamente ao formulário de resposta", () => {
    expect(publicIdentificationStep("not_found")).toBe("register");
  });

  it("mantém a interrupção segura para nomes ambíguos", () => {
    expect(publicIdentificationStep("ambiguous")).toBe("ambiguous");
  });
});
