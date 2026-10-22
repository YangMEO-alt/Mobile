/** Tipos e reducers puros compartilhados pela tela mobile do chat. */
export type TipoMensagem = "text" | "file" | "audio" | "proposta_adocao";

export type MensagemChat = {
  id: string;
  senderId: string;
  type: TipoMensagem;
  text: string | null;
  url?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt?: string;
  deletada?: boolean;
  moderado?: boolean;
  lida?: boolean;
  proposta?: unknown;
};

export type MensagemApi = Omit<MensagemChat, "id" | "type"> & {
  id: number | string;
  type?: string;
};

export type ConversaChat = {
  idConversa: number;
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  lastMessage?: string | null;
  updatedAt?: string | null;
  idAnimal?: number | null;
  nomeAnimal?: string | null;
  bloqueada?: boolean;
  bloqueadaMotivo?: string | null;
  naoLidas: number;
  online?: boolean;
  idOrganizacaoResgate?: number | null;
};

export type EventoChat = { tipo: string; dados?: Record<string, any> };

export function converterMensagem(mensagem: MensagemApi): MensagemChat {
  const tipos: Record<string, TipoMensagem> = {
    TEXTO: "text", text: "text", ARQUIVO: "file", file: "file",
    AUDIO: "audio", audio: "audio", PROPOSTA_ADOCAO: "proposta_adocao",
    proposta_adocao: "proposta_adocao",
  };
  return { ...mensagem, id: String(mensagem.id), type: tipos[mensagem.type ?? ""] ?? "text" };
}

export function previaDaMensagem(mensagem: MensagemApi) {
  if (mensagem.type === "AUDIO" || mensagem.type === "audio") return "Áudio";
  if (mensagem.type === "ARQUIVO" || mensagem.type === "file") return mensagem.fileName || "Arquivo";
  return (mensagem.text || "Proposta de adoção").slice(0, 200);
}

export function inserirMensagem(mensagens: MensagemChat[], nova: MensagemChat) {
  if (mensagens.some((m) => m.id === nova.id)) return mensagens;
  return [...mensagens, nova].sort((a, b) => Number(a.id) - Number(b.id));
}

export function mesclarMensagens(atuais: MensagemChat[], recebidas: MensagemChat[]) {
  const porId = new Map(atuais.map((m) => [m.id, m]));
  recebidas.forEach((m) => porId.set(m.id, m));
  return [...porId.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

export function aplicarEventoNasMensagens(mensagens: MensagemChat[], evento: EventoChat, idConversaAtual: number | null) {
  const dados = evento.dados ?? {};
  if (Number(dados.idConversa) !== Number(idConversaAtual)) return mensagens;
  switch (evento.tipo) {
    case "MENSAGEM": return inserirMensagem(mensagens, converterMensagem(dados.mensagem as MensagemApi));
    case "MENSAGEM_APAGADA":
      return mensagens.map((m) => m.id === String(dados.idMensagem) ? { ...m, text: null, url: null, fileName: null, fileType: null, proposta: null, deletada: true } : m);
    case "MENSAGEM_MODERADA":
      return mensagens.map((m) => m.id === String(dados.idMensagem) ? { ...m, text: null, url: null, fileName: null, fileType: null, proposta: null, moderado: true } : m);
    case "LIDA":
      return mensagens.map((m) => m.senderId !== dados.leitor && !m.lida && Number(m.id) <= Number(dados.lidoAte) ? { ...m, lida: true } : m);
    default: return mensagens;
  }
}

export function aplicarEventoNasConversas(conversas: ConversaChat[], evento: EventoChat, meuUid: string, idConversaAtual: number | null) {
  const dados = evento.dados ?? {};
  const id = Number(dados.idConversa);
  const indice = conversas.findIndex((c) => Number(c.idConversa) === id);
  switch (evento.tipo) {
    case "MENSAGEM": {
      if (indice < 0) return { conversas, recarregar: true };
      const mensagem = dados.mensagem as MensagemApi;
      const atualizada = {
        ...conversas[indice], lastMessage: previaDaMensagem(mensagem), updatedAt: mensagem.createdAt,
        naoLidas: conversas[indice].naoLidas + (mensagem.senderId !== meuUid && id !== Number(idConversaAtual) ? 1 : 0),
      };
      return { conversas: [atualizada, ...conversas.filter((_, i) => i !== indice)], recarregar: false };
    }
    case "LIDA":
      if (indice < 0 || dados.leitor !== meuUid) return { conversas, recarregar: false };
      return { conversas: conversas.map((c, i) => i === indice ? { ...c, naoLidas: 0 } : c), recarregar: false };
    case "MENSAGEM_APAGADA": case "MENSAGEM_MODERADA":
      return { conversas, recarregar: indice >= 0 };
    case "CONVERSA_BLOQUEADA":
      return { conversas: conversas.map((c, i) => i === indice ? { ...c, bloqueada: true, bloqueadaMotivo: dados.motivo } : c), recarregar: false };
    case "CONVERSA_DESBLOQUEADA":
      return { conversas: conversas.map((c, i) => i === indice ? { ...c, bloqueada: false, bloqueadaMotivo: null } : c), recarregar: false };
    default: return { conversas, recarregar: false };
  }
}
