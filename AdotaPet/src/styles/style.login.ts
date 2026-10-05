import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fundo: {
    flex: 1,
    backgroundColor: "#FFF4E6",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  cabecalho: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#C2571A",
  },
  subtitulo: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B5B4D",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2B2118",
    textAlign: "center",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2B2118",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#2B2118",
    backgroundColor: "#FFFCF8",
  },
  linkArea: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2571A",
  },
  botao: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#C2571A",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoPressionado: {
    opacity: 0.85,
  },
  botaoDesabilitado: {
    backgroundColor: "#D9A582",
  },
  botaoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    textAlign: "center",
    overflow: "hidden",
  },
  messageError: {
    backgroundColor: "#FDECEA",
    color: "#B3261E",
  },
  messageSuccess: {
    backgroundColor: "#E7F5EA",
    color: "#1E7B34",
  },
  cadastroLinha: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  cadastroTexto: {
    fontSize: 14,
    color: "#6B5B4D",
  },
  privacidade: {
    marginTop: 20,
    fontSize: 13,
    color: "#6B5B4D",
    textAlign: "center",
  },
});

export default styles;