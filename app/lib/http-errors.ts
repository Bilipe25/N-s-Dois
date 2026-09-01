export function responseFallback(status: number) {
  if (status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (status >= 500) return "O serviço está temporariamente indisponível. Tente novamente em instantes.";
  return "Não foi possível concluir esta ação. Revise os dados e tente novamente.";
}

export function connectionFallback(offline: boolean) {
  return offline
    ? "Você está sem conexão. Sua resposta não foi enviada; tente novamente quando a internet voltar."
    : "Não foi possível conectar agora. Confira sua internet e tente novamente.";
}
