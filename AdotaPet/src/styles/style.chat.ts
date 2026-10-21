import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fundo: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pressionado: {
    opacity: 0.85,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6DA",
  },
  titulo: {
    flex: 1,
    marginRight: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#2B2118",
  },
  fechar: {
    fontSize: 30,
    lineHeight: 30,
    color: "#6B5B4D",
  },

  conteudo: {
    padding: 20,
    paddingBottom: 12,
  },
  subtitulo: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B5B4D",
  },

  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#2B2118",
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

  opcaoOrg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    borderRadius: 10,
    backgroundColor: "#FFFCF8",
  },
  opcaoOrgAtiva: {
    borderColor: "#C2571A",
    backgroundColor: "#FFF4E6",
  },
  opcaoOrgTexto: {
    flex: 1,
    fontSize: 15,
    color: "#2B2118",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E3D5C6",
    alignItems: "center",
    justifyContent: "center",
  },
  radioAtivo: {
    borderColor: "#C2571A",
  },
  radioMiolo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#C2571A",
  },

  buscaLinha: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  buscaInput: {
    flex: 1,
  },
  buscaBotao: {
    minWidth: 84,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  buscaBotaoDesabilitado: {
    backgroundColor: "#D9A582",
  },
  buscaBotaoTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  mapaWrap: {
    height: 280,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3D5C6",
  },
  mapa: {
    flex: 1,
  },

  enderecoPreview: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF4E6",
  },
  enderecoPlaceholder: {
    fontSize: 14,
    color: "#9A8F85",
  },
  enderecoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2B2118",
  },

  dataLinha: {
    flexDirection: "row",
    gap: 8,
  },
  dataInput: {
    flex: 2,
  },
  horaInput: {
    flex: 1,
  },

  erroTexto: {
    marginTop: 6,
    fontSize: 13,
    color: "#B3261E",
  },
  erroCaixa: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    textAlign: "center",
    overflow: "hidden",
    backgroundColor: "#FDECEA",
    color: "#B3261E",
  },

  rodape: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0E6DA",
    backgroundColor: "#FFFFFF",
  },
  btnCancelar: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C2571A",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C2571A",
  },
  btnDesabilitadoSuave: {
    opacity: 0.5,
  },
  btnConfirmar: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  btnConfirmarDesabilitado: {
    backgroundColor: "#D9A582",
  },
  btnLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnConfirmarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF"
}
});