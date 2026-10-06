import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "#FFF4E6",
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  pressionado: {
    opacity: 0.85,
  },

  alertaAcessoNegado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FDECEA",
  },
  alertaTexto: {
    flex: 1,
    fontSize: 14,
    color: "#B3261E",
  },
  alertaFechar: {
    marginLeft: 12,
    fontSize: 22,
    lineHeight: 22,
    color: "#B3261E",
  },

  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  heroTitulo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#C2571A",
    textAlign: "center",
  },
  heroSubtitulo: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
    color: "#6B5B4D",
    textAlign: "center",
  },
  busca: {
    alignSelf: "stretch",
    height: 48,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    borderRadius: 24,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#2B2118",
    backgroundColor: "#FFFFFF",
  },

  botaoFiltrar: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    backgroundColor: "#FFFFFF",
  },
  botaoFiltrarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2B2118",
  },
  filtrosAtivosIndicador: {
    width: 8,
    height: 8,
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: "#C2571A",
  },

  estadoVazio: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  estadoVazioTexto: {
    fontSize: 15,
    color: "#6B5B4D",
  },

  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImagem: {
    width: "100%",
    height: 200,
  },
  cardImagemPlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBE3CC",
  },
  cardImagemEmoji: {
    fontSize: 56,
  },
  cardCorpo: {
    padding: 16,
  },
  cardNome: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2B2118",
  },
  cardRaca: {
    marginTop: 2,
    fontSize: 14,
    color: "#6B5B4D",
  },
  cardLocalizacao: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B5B4D",
  },
  badgeLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F3EADF",
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A3B2E",
  },
  badgeMacho: {
    backgroundColor: "#DCEBFA",
  },
  badgeFemea: {
    backgroundColor: "#FADCEA",
  },
  cardDescricao: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#4A3B2E",
  },
  botaoAdotar: {
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  botaoAdotarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  botaoDenunciar: {
    height: 42,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoDenunciarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B3261E",
  },

  modalFundo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  filtrosHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6DA",
  },
  filtrosTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2B2118",
  },
  filtrosHeaderAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  filtrosLimpar: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2571A",
  },
  filtrosFechar: {
    fontSize: 30,
    lineHeight: 30,
    color: "#6B5B4D",
  },
  filtrosConteudo: {
    padding: 20,
    gap: 24,
  },
  toggleLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTexto: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2B2118",
  },
  filtroGrupo: {
    gap: 10,
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2B2118",
  },
  chipsLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    backgroundColor: "#FFFCF8",
  },
  chipAtivo: {
    borderColor: "#C2571A",
    backgroundColor: "#C2571A",
  },
  chipTexto: {
    fontSize: 14,
    color: "#4A3B2E",
  },
  chipTextoAtivo: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filtrosRodape: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0E6DA",
  },
  filtrosAplicar: {
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  filtrosAplicarTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export { styles };