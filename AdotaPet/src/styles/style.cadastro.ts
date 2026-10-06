import {StyleSheet} from "react-native";

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
  pressionado: {
    opacity: 0.85,
  },
  cabecalho: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#C2571A",
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
    fontSize: 22,
    fontWeight: "700",
    color: "#2B2118",
    textAlign: "center",
    marginBottom: 20,
  },

  progresso: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 24,
  },
  progressoItemLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  progressoEtapa: {
    width: 78,
    alignItems: "center",
  },
  progressoBolha: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E3D5C6",
    backgroundColor: "#FFFFFF",
  },
  progressoBolhaConcluida: {
    borderColor: "#C2571A",
    backgroundColor: "#C2571A",
  },
  progressoBolhaAtual: {
    borderColor: "#C2571A",
    backgroundColor: "#C2571A",
  },
  progressoBolhaTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9A8F85",
  },
  progressoBolhaTextoAtivo: {
    color: "#FFFFFF",
  },
  progressoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: "#9A8F85",
    textAlign: "center",
  },
  progressoLabelAtual: {
    fontWeight: "700",
    color: "#C2571A",
  },
  progressoLinha: {
    width: 24,
    height: 2,
    marginTop: 15,
    backgroundColor: "#E3D5C6",
  },
  progressoLinhaConcluida: {
    backgroundColor: "#C2571A",
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
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#2B2118",
    backgroundColor: "#FFFCF8",
  },
  textarea: {
    minHeight: 84,
    paddingTop: 12,
  },
  erroCampo: {
    marginTop: 6,
    fontSize: 13,
    color: "#B3261E",
  },

  checkboxLinha: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkboxCaixa: {
    width: 24,
    height: 24,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#E3D5C6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFCF8",
  },
  checkboxCaixaMarcada: {
    borderColor: "#C2571A",
    backgroundColor: "#C2571A",
  },
  checkboxMarca: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  checkboxTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#4A3B2E",
  },

  seletor: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E3D5C6",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFCF8",
  },
  seletorDesabilitado: {
    opacity: 0.6,
  },
  seletorTexto: {
    flex: 1,
    fontSize: 16,
    color: "#2B2118",
  },
  seletorPlaceholder: {
    color: "#9A8F85",
  },
  seletorSeta: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B5B4D",
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6DA",
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2B2118",
  },
  modalFechar: {
    fontSize: 30,
    lineHeight: 30,
    color: "#6B5B4D",
  },
  modalBuscaArea: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6DA",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F0E7",
  },
  modalItemTexto: {
    flex: 1,
    fontSize: 16,
    color: "#2B2118",
  },
  modalItemSelecionado: {
    fontWeight: "700",
    color: "#C2571A",
  },
  modalItemMarca: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#C2571A",
  },
  modalVazio: {
    padding: 32,
    fontSize: 15,
    color: "#6B5B4D",
    textAlign: "center",
  },

  message: {
    marginBottom: 16,
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

  navegacaoEtapas: {
    flexDirection: "row",
    gap: 12,
  },
  botaoVoltar: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C2571A",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoVoltarTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#C2571A",
  },
  botaoDesabilitadoSuave: {
    opacity: 0.5,
  },
  botaoContinuar: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#C2571A",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoDesabilitado: {
    backgroundColor: "#D9A582",
  },
  botaoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botaoContinuarTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  loginLinha: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginTexto: {
    fontSize: 14,
    color: "#6B5B4D",
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2571A",
  },
});

export { styles };