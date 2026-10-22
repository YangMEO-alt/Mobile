import { StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f5", paddingTop: PlatformSafeTop() },
  cabecalho: { paddingTop: 12, paddingBottom: 14, paddingHorizontal: 18, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e4e7" },
  cabecalhoLista: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, paddingBottom: 14, paddingHorizontal: 18, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e4e7" }, voltarLista: { width: 30, height: 40, justifyContent: "center" },
  cabecalhoChat: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", gap: 10 },
  cabecalhoContato: { flex: 1 }, titulo: { fontSize: 19, fontWeight: "700", color: "#18181b" }, subtitulo: { marginTop: 3, fontSize: 12, color: "#71717a" },
  lista: { padding: 16, gap: 10, flexGrow: 1 }, listaConversas: { paddingVertical: 4, flexGrow: 1 },
  itemConversa: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f2" },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" }, avatarTexto: { color: "#1d4ed8", fontSize: 18, fontWeight: "700" },
  detalhesConversa: { flex: 1, minWidth: 0 }, linhaConversa: { flexDirection: "row", alignItems: "center", gap: 8 }, nomeContato: { flex: 1, fontSize: 15, fontWeight: "600", color: "#18181b" }, hora: { fontSize: 11, color: "#71717a" }, nomeAnimal: { marginTop: 2, fontSize: 11, color: "#71717a" }, ultimaMensagem: { marginTop: 4, fontSize: 13, color: "#52525b" },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" }, badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  linhaMensagem: { width: "100%", flexDirection: "row" }, linhaMinha: { justifyContent: "flex-end" }, linhaOutra: { justifyContent: "flex-start" },
  balao: { maxWidth: "84%", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 }, balaoMinha: { backgroundColor: "#2563eb", borderBottomRightRadius: 4 }, balaoOutro: { backgroundColor: "#fff", borderBottomLeftRadius: 4 }, textoMinha: { color: "#fff", fontSize: 15 }, textoOutro: { color: "#18181b", fontSize: 15 }, textoApagado: { fontStyle: "italic", color: "#71717a" },
  horaMensagem: { fontSize: 10, marginTop: 4, textAlign: "right" }, horaMinha: { color: "#dbeafe" }, horaOutra: { color: "#71717a" },
  barraEnvio: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e4e4e7" },
  input: { flex: 1, minHeight: 44, maxHeight: 120, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: "#f4f4f5", color: "#18181b" }, botao: { minWidth: 72, height: 44, paddingHorizontal: 14, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb" }, botaoDesabilitado: { opacity: 0.5 }, botaoTexto: { color: "#fff", fontWeight: "600" },
  voltar: { width: 36, height: 40, alignItems: "center", justifyContent: "center" }, voltarTexto: { fontSize: 34, color: "#2563eb", lineHeight: 38 }, online: { color: "#16a34a", fontSize: 12 }, digitando: { paddingHorizontal: 18, paddingVertical: 4, fontSize: 12, color: "#71717a", backgroundColor: "#fff" }, avisoBloqueio: { padding: 10, textAlign: "center", color: "#b91c1c", backgroundColor: "#fee2e2" }, erro: { paddingHorizontal: 16, paddingVertical: 10, color: "#b91c1c", backgroundColor: "#fee2e2" }, estado: { padding: 24, textAlign: "center", color: "#71717a", lineHeight: 20 },
});

function PlatformSafeTop() {
  return Math.max(StatusBar.currentHeight ?? 0, 0);
}
