import { Client, ReconnectionTimeMode } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  Pressable, SafeAreaView, StatusBar, Text, TextInput, View,
} from "react-native";
import { api, API_URL, garantirAccessToken, extrairMensagemErro } from "../../lib/api";
import {
  aplicarEventoNasConversas, aplicarEventoNasMensagens, ConversaChat,
  EventoChat, MensagemApi, MensagemChat, converterMensagem, mesclarMensagens,
} from "../../lib/chatEventos";
import { styles } from "../../styles/style.chat";

type MeuPerfil = { publicId: string; nome?: string; foto?: string | null };
type ContatoInicial = { uid?: string; displayName: string; photoURL: string | null; idAnimal: number; nomeAnimal: string };
type PaginaMensagens = { mensagens: MensagemApi[]; temMais: boolean };

function uuid() {
  // UUID v4 compatível com ambientes React Native sem depender de crypto.randomUUID.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function hora(valor?: string) {
  if (!valor) return "";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen({ onVoltar, initialContact }: { onVoltar?: () => void; initialContact?: ContatoInicial | null }) {
  const [meuPerfil, setMeuPerfil] = useState<MeuPerfil | null>(null);
  const [conversas, setConversas] = useState<ConversaChat[]>([]);
  const [conversa, setConversa] = useState<ConversaChat | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [digitando, setDigitando] = useState(false);
  const listaRef = useRef<FlatList<MensagemChat>>(null);
  const conversaRef = useRef<number | null>(null);
  const perfilRef = useRef<MeuPerfil | null>(null);
  const conversasRef = useRef<ConversaChat[]>([]);
  const clientRef = useRef<Client | null>(null);
  const contatoInicialProcessadoRef = useRef<string | null>(null);

  useEffect(() => { conversaRef.current = conversa?.idConversa ?? null; }, [conversa]);
  useEffect(() => { perfilRef.current = meuPerfil; }, [meuPerfil]);
  useEffect(() => { conversasRef.current = conversas; }, [conversas]);

  const carregarConversas = useCallback(async () => {
    const dados = await api<ConversaChat[]>("/chat/conversas");
    const lista = Array.isArray(dados) ? dados.map((c) => ({ ...c, displayName: c.displayName || "Usuário", naoLidas: Number(c.naoLidas || 0) })) : [];
    setConversas(lista);
    return lista;
  }, []);

  const carregarMensagens = useCallback(async (id: number) => {
    const dados = await api<PaginaMensagens>(`/chat/conversas/${id}/mensagens`, { params: { limite: 100 } });
    if (Number(conversaRef.current) !== Number(id)) return;
    setMensagens((atuais) => mesclarMensagens(atuais, (dados.mensagens ?? []).map(converterMensagem)));
  }, []);

  const marcarLida = useCallback(async (id: number) => {
    try { await api(`/chat/conversas/${id}/lida`, { method: "POST" }); } catch { /* será tentado novamente ao reabrir */ }
  }, []);

  const tratarEvento = useCallback((evento: EventoChat) => {
    const meuUid = perfilRef.current?.publicId;
    if (!meuUid) return;
    if (evento.tipo === "DIGITANDO") {
      const dados = evento.dados ?? {};
      if (Number(dados.idConversa) === Number(conversaRef.current) && dados.uid !== meuUid) setDigitando(Boolean(dados.ativo));
      return;
    }
    setMensagens((atuais) => aplicarEventoNasMensagens(atuais, evento, conversaRef.current));
    const resultado = aplicarEventoNasConversas(conversasRef.current, evento, meuUid, conversaRef.current);
    conversasRef.current = resultado.conversas;
    setConversas(resultado.conversas);
    if (resultado.recarregar) carregarConversas().catch(() => undefined);
    const dados = evento.dados ?? {};
    if (evento.tipo === "MENSAGEM" && Number(dados.idConversa) === Number(conversaRef.current) && dados.mensagem?.senderId !== meuUid) {
      marcarLida(Number(dados.idConversa));
      setDigitando(false);
    }
    if (evento.tipo === "CONVERSA_BLOQUEADA" && Number(dados.idConversa) === Number(conversaRef.current)) {
      setConversa((atual) => atual ? { ...atual, bloqueada: true, bloqueadaMotivo: dados.motivo } : atual);
    }
    if (evento.tipo === "CONVERSA_DESBLOQUEADA" && Number(dados.idConversa) === Number(conversaRef.current)) {
      setConversa((atual) => atual ? { ...atual, bloqueada: false, bloqueadaMotivo: null } : atual);
    }
  }, [carregarConversas, marcarLida]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true); setErro(null);
      try {
        const [perfil] = await Promise.all([api<MeuPerfil>("/usuario/me"), carregarConversas()]);
        if (ativo) setMeuPerfil(perfil);
      } catch (e) {
        if (ativo) setErro(extrairMensagemErro(e, "Não foi possível carregar o Chat. Entre novamente na sua conta."));
      } finally { if (ativo) setCarregando(false); }
    })();
    return () => { ativo = false; };
  }, [carregarConversas]);

  useEffect(() => {
    if (!meuPerfil) return;
    let ativo = true;
    const base = new URL(API_URL);
    const scheme = base.protocol === "https:" ? "wss:" : "ws:";
    const client = new Client({
      brokerURL: `${scheme}//${base.host}/ws`,
      reconnectDelay: 1500,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: async () => {
        const token = await garantirAccessToken();
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      },
      onConnect: () => {
        if (!ativo) return;
        client.subscribe("/user/queue/eventos", (frame) => {
          try { tratarEvento(JSON.parse(frame.body) as EventoChat); }
          catch (e) { console.warn("Evento de chat inválido", e); }
        });
        carregarConversas().catch(() => undefined);
        const id = conversaRef.current;
        if (id) carregarMensagens(id).catch(() => undefined);
      },
      onStompError: (frame) => console.warn("Erro no WebSocket do chat", frame.headers.message),
    });
    clientRef.current = client;
    client.activate();
    return () => { ativo = false; clientRef.current = null; void client.deactivate(); };
  }, [meuPerfil, carregarConversas, carregarMensagens, tratarEvento]);

  const abrirConversa = useCallback(async (item: ConversaChat) => {
    setErro(null); setConversa(item); setMensagens([]); setDigitando(false);
    conversaRef.current = item.idConversa;
    try {
      await carregarMensagens(item.idConversa);
      await marcarLida(item.idConversa);
      setConversas((atual) => atual.map((c) => c.idConversa === item.idConversa ? { ...c, naoLidas: 0 } : c));
    } catch (e) { setErro(extrairMensagemErro(e, "Não foi possível abrir esta conversa.")); }
  }, [carregarMensagens, marcarLida]);

  // Quando o usuário toca em “Adotar”, cria/recupera a conversa pela mesma API usada na web.
  useEffect(() => {
    if (carregando || !meuPerfil || !initialContact?.uid) return;
    const chave = `${initialContact.uid}:${initialContact.idAnimal}`;
    if (contatoInicialProcessadoRef.current === chave) return;
    contatoInicialProcessadoRef.current = chave;
    let ativo = true;
    (async () => {
      try {
        setErro(null);
        const criada = await api<Partial<ConversaChat> & { idConversa?: number }>("/chat/conversas", {
          method: "POST",
          body: { idUsuarioDestino: initialContact.uid, idAnimal: initialContact.idAnimal, idOrganizacao: null },
        });
        const lista = await carregarConversas();
        if (!ativo) return;
        const encontrada = lista.find((c) => Number(c.idConversa) === Number(criada.idConversa));
        const alvo: ConversaChat | null = encontrada ?? (criada.idConversa ? {
          idConversa: Number(criada.idConversa), uid: initialContact.uid!,
          displayName: initialContact.displayName || "Tutor", photoURL: initialContact.photoURL,
          idAnimal: initialContact.idAnimal, nomeAnimal: initialContact.nomeAnimal,
          naoLidas: 0, bloqueada: Boolean(criada.bloqueada),
          bloqueadaMotivo: criada.bloqueadaMotivo ?? null,
        } : null);
        if (alvo) await abrirConversa(alvo);
        else setErro("A conversa foi solicitada, mas o servidor não retornou o identificador dela.");
      } catch (e) {
        if (ativo) setErro(extrairMensagemErro(e, "Não foi possível iniciar a conversa com o tutor."));
      }
    })();
    return () => { ativo = false; };
  }, [carregando, meuPerfil, initialContact, carregarConversas, abrirConversa]);

  const enviar = useCallback(async () => {
    const conteudo = texto.trim();
    const id = conversaRef.current;
    if (!conteudo || !id || enviando) return;
    if (conversa?.bloqueada) { Alert.alert("Conversa bloqueada", "Não é possível enviar mensagens nesta conversa."); return; }
    setEnviando(true); setErro(null);
    try {
      const mensagem = await api<MensagemApi>(`/chat/conversas/${id}/mensagens`, {
        method: "POST", body: { clientMsgId: uuid(), tipo: "TEXTO", texto: conteudo },
      });
      tratarEvento({ tipo: "MENSAGEM", dados: { idConversa: id, mensagem } });
      setTexto("");
    } catch (e) { setErro(extrairMensagemErro(e, "Não foi possível enviar a mensagem.")); }
    finally { setEnviando(false); }
  }, [texto, enviando, conversa, tratarEvento]);

  const voltar = () => { setConversa(null); setMensagens([]); setErro(null); setDigitando(false); conversaRef.current = null; };

  if (carregando) return <SafeAreaView style={styles.container}><StatusBar barStyle="dark-content" /><ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2563eb" /><Text style={styles.estado}>Carregando conversas…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {!conversa ? <>
        <View style={styles.cabecalhoLista}>{onVoltar ? <Pressable onPress={onVoltar} style={styles.voltarLista}><Text style={styles.voltarTexto}>‹</Text></Pressable> : null}<View style={{ flex: 1 }}><Text style={styles.titulo}>Conversas</Text><Text style={styles.subtitulo}>{meuPerfil?.nome ? `Olá, ${meuPerfil.nome}` : "Suas mensagens"}</Text></View></View>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <FlatList
          data={conversas}
          keyExtractor={(item) => String(item.idConversa)}
          contentContainerStyle={styles.listaConversas}
          ListEmptyComponent={<Text style={styles.estado}>Você ainda não tem conversas. Elas aparecerão aqui quando forem iniciadas.</Text>}
          refreshing={carregando}
          onRefresh={() => carregarConversas().catch((e) => setErro(extrairMensagemErro(e)))}
          renderItem={({ item }) => <Pressable style={styles.itemConversa} onPress={() => abrirConversa(item)}>
            <View style={styles.avatar}><Text style={styles.avatarTexto}>{(item.displayName || "U").trim().charAt(0).toUpperCase()}</Text></View>
            <View style={styles.detalhesConversa}>
              <View style={styles.linhaConversa}><Text numberOfLines={1} style={styles.nomeContato}>{item.displayName || "Usuário"}</Text><Text style={styles.hora}>{hora(item.updatedAt)}</Text></View>
              {item.nomeAnimal ? <Text style={styles.nomeAnimal}>Sobre: {item.nomeAnimal}</Text> : null}
              <Text numberOfLines={1} style={styles.ultimaMensagem}>{item.lastMessage || "Abra para ver as mensagens"}</Text>
            </View>
            {item.naoLidas > 0 ? <View style={styles.badge}><Text style={styles.badgeTexto}>{item.naoLidas > 99 ? "99+" : item.naoLidas}</Text></View> : null}
          </Pressable>}
        />
      </> : <>
        <View style={styles.cabecalhoChat}>
          <Pressable onPress={voltar} style={styles.voltar}><Text style={styles.voltarTexto}>‹</Text></Pressable>
          <View style={styles.cabecalhoContato}><Text style={styles.titulo}>{conversa.displayName || "Usuário"}</Text>{conversa.nomeAnimal ? <Text style={styles.subtitulo}>Sobre: {conversa.nomeAnimal}</Text> : null}</View>
          {conversa.online ? <Text style={styles.online}>online</Text> : null}
        </View>
        {conversa.bloqueada ? <Text style={styles.avisoBloqueio}>Conversa bloqueada{conversa.bloqueadaMotivo ? `: ${conversa.bloqueadaMotivo}` : "."}</Text> : null}
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        <FlatList
          ref={listaRef} data={mensagens} keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.estado}>Nenhuma mensagem ainda. Envie a primeira!</Text>}
          renderItem={({ item }) => {
            const minha = item.senderId === meuPerfil?.publicId;
            return <View style={[styles.linhaMensagem, minha ? styles.linhaMinha : styles.linhaOutra]}>
              <View style={[styles.balao, minha ? styles.balaoMinha : styles.balaoOutro]}>
                {item.deletada ? <Text style={[styles.textoOutro, styles.textoApagado]}>Esta mensagem foi apagada</Text>
                  : item.moderado ? <Text style={[styles.textoOutro, styles.textoApagado]}>Esta mensagem foi removida pela moderação</Text>
                  : <Text style={minha ? styles.textoMinha : styles.textoOutro}>{item.text ?? (item.type === "file" ? `Arquivo: ${item.fileName || "anexo"}` : item.type === "audio" ? "Áudio" : "Proposta de adoção")}</Text>}
                <Text style={[styles.horaMensagem, minha ? styles.horaMinha : styles.horaOutra]}>{hora(item.createdAt)}{minha && item.lida ? "  ✓✓" : ""}</Text>
              </View>
            </View>;
          }}
        />
        {digitando ? <Text style={styles.digitando}>A outra pessoa está digitando…</Text> : null}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}>
          <View style={styles.barraEnvio}>
            <TextInput style={styles.input} value={texto} onChangeText={setTexto} placeholder={conversa.bloqueada ? "Conversa bloqueada" : "Digite uma mensagem"} editable={!conversa.bloqueada && !enviando} multiline maxLength={2000} returnKeyType="send" onSubmitEditing={enviar} blurOnSubmit={false} />
            <Pressable style={[styles.botao, (enviando || conversa.bloqueada || !texto.trim()) && styles.botaoDesabilitado]} onPress={enviar} disabled={enviando || conversa.bloqueada || !texto.trim()}>
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Enviar</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </>}
    </SafeAreaView>
  );
}
