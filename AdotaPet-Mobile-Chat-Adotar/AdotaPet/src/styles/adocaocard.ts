import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  pressionado: {
    opacity: 0.85,
  },
  desabilitadoSuave: {
    opacity: 0.5,
  },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3D5C6",
    backgroundColor: "#FFFFFF",
    gap: 10,
  },
  cardCancelada: {
    backgroundColor: "#F7F0E7",
    opacity: 0.85,
  },
  titulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2B2118",
  },
  avisoCancelada: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B5B4D",
  },

  mapaWrap: {
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3D5C6",
  },
  mapa: {
    flex: 1,
  },
  endereco: {
    fontSize: 13,
    lineHeight: 19,
    color: "#4A3B2E",
  },
  dataDeEntrega: {
    fontSize: 14,
    color: "#4A3B2E",
  },
  dataDeEntregaNegrito: {
    fontWeight: "700",
    color: "#2B2118",
  },
  linkMapaArea: {
    alignSelf: "flex-start",
  },
  linkMapa: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2571A",
  },

  btnCancelar: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B3261E",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelarTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B3261E",
  },
  btnConfirmarAdocao: {
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  btnConfirmarAdocaoDesabilitado: {
    backgroundColor: "#D9A582",
  },
  btnTextoClaro: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  erro: {
    fontSize: 13,
    color: "#B3261E",
  },
  avisoConcluida: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E7B34",
  },

  modalFundo: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCaixa: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2B2118",
  },
  modalTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A3B2E",
  },
  modalAcoes: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancelar: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C2571A",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelarTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C2571A",
  },
  modalConfirmar: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2571A",
  },
  modalConfirmarDesabilitado: {
    backgroundColor: "#D9A582",
  },
});