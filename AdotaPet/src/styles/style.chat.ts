import {StatusBar, StyleSheet} from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  cabecalho: {
    paddingTop: (StatusBar.currentHeight ?? 44) + 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
  },
  lista: {
    padding: 16,
    gap: 8,
  },
  balao: {
    maxWidth: "80%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  balaoMinha: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  balaoOutro: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
  },
  textoMinha: {
    color: "#ffffff",
  },
  textoOutro: {
    color: "#18181b",
  },
  barraEnvio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    paddingBottom: 24,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "#f4f4f5",
  },
  botao: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  botaoTexto: {
    color: "#ffffff",
    fontWeight: "600",
  },
});