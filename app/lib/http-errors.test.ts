import { describe, expect, it } from "vitest";
import { connectionFallback, responseFallback } from "./http-errors";

describe("mensagens humanas de rede", () => {
  it("diferencia uma falha offline sem sugerir problema na lista", () => {
    expect(connectionFallback(true)).toBe("Você está sem conexão. Sua resposta não foi enviada; tente novamente quando a internet voltar.");
  });

  it("apresenta uma mensagem recuperável para erro 500 sem corpo público", () => {
    expect(responseFallback(500)).toBe("O serviço está temporariamente indisponível. Tente novamente em instantes.");
  });
});
