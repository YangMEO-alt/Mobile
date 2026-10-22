import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { api, ErroHttp, extrairMensagemErro } from "../../lib/api";
import {styles} from "../../styles/propostaAdocao";
import { modalStyles } from "../../styles/modal";

export type PropostaAdocao = {
  idProposta?: number;
  lat: number;
  lng: number;
  endereco?: string | null;
  dataDeEntrega: string;
};

type Props = {
  proposta: PropostaAdocao;
  nomeAnimal?: string;
  idAnimal?: number;
  ehTutor?: boolean;
  onCancelada?: () => void;
  onFinalizada?: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

function formatarDataDeEntrega(iso: string) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()} ${pad(
    data.getHours()
  )}:${pad(data.getMinutes())}`;
}

function ModalConfirmarAdocao({
  nomeAnimal,
  confirmando,
  erro,
  onClose,
  onConfirmar,
}: {
  nomeAnimal?: string;
  confirmando: boolean;
  erro: string | null;
  onClose: () => void;
  onConfirmar: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.modalFundo}>
        <View style={modalStyles.modalCaixa}>
          <Text style={modalStyles.modalTitulo}>Confirmar doação</Text>
          <Text style={modalStyles.modalTexto}>
            Confirma que {nomeAnimal || "o animal"} foi entregue? Depois de confirmada, a doação
            será marcada como concluída.
          </Text>

          {!!erro && <Text style={modalStyles.erro}>{erro}</Text>}

          <View style={modalStyles.modalAcoes}>
            <Pressable
              onPress={onClose}
              disabled={confirmando}
              style={({ pressed }) => [
                modalStyles.modalCancelar,
                confirmando && styles.btnDesabilitadoSuave,
                pressed && styles.pressionado,
              ]}
            >
              <Text style={modalStyles.modalCancelarTexto}>Voltar</Text>
            </Pressable>

            <Pressable
              onPress={onConfirmar}
              disabled={confirmando}
              style={({ pressed }) => [
                modalStyles.modalConfirmar,
                confirmando && modalStyles.modalConfirmarDesabilitado,
                pressed && styles.pressionado,
              ]}
            >
              {confirmando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={modalStyles.modalConfirmarTexto}>Confirmar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PropostaAdocaoCard({
  proposta,
  nomeAnimal,
  idAnimal,
  ehTutor = false,
  onCancelada,
  onFinalizada,
}: Props) {
  const { lat, lng, endereco, dataDeEntrega, idProposta } = proposta;

  const [cancelando, setCancelando] = useState(false);
  const [cancelada, setCancelada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [modalConfirmarAberto, setModalConfirmarAberto] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [finalizada, setFinalizada] = useState(false);
  const [erroFinalizar, setErroFinalizar] = useState<string | null>(null);

  useEffect(() => {
    if (!idAnimal || !idProposta) return;

    let ativo = true;

    api<{ idProposta?: number }>(`/proposta-adocao/animal/${idAnimal}`)
      .then((res) => {
        if (ativo && res?.idProposta !== idProposta) setCancelada(true);
      })
      .catch((err: unknown) => {
        if (ativo && err instanceof ErroHttp && err.status === 404) setCancelada(true);
      });

    return () => {
      ativo = false;
    };
  }, [idAnimal, idProposta]);

  const handleCancelar = async () => {
    if (!idProposta || cancelando) return;

    setCancelando(true);
    setErro(null);

    try {
      await api(`/proposta-adocao/${idProposta}/cancelar`, { method: "PUT" });
      setCancelada(true);
      onCancelada?.();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível cancelar agora."));
    } finally {
      setCancelando(false);
    }
  };

  const handleConfirmarAdocao = async () => {
    if (!idProposta || finalizando) return;

    setFinalizando(true);
    setErroFinalizar(null);

    try {
      await api(`/proposta-adocao/${idProposta}/finalizar`, { method: "PUT" });
      setFinalizada(true);
      setModalConfirmarAberto(false);
      onFinalizada?.();
    } catch (err) {
      setErroFinalizar(extrairMensagemErro(err, "Não foi possível confirmar a doação agora."));
    } finally {
      setFinalizando(false);
    }
  };

  const abrirNoMapa = () => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() =>
      Alert.alert("Mapa", "Não foi possível abrir o mapa neste aparelho.")
    );
  };

  const podeGerenciar = ehTutor && !cancelada && !finalizada && !!idProposta;

  return (
    <View style={[styles.fundo, cancelada && { backgroundColor: "#F5F5F5" }]}>
      <Text style={styles.titulo}>
        🐾 Doação{nomeAnimal ? ` de ${nomeAnimal}` : ""}{" "}
        {cancelada ? "cancelada" : finalizada ? "concluída!" : "confirmada!"}
      </Text>

      {cancelada ? (
        <Text style={modalStyles.avisoCancelada}>
          ⚠️ Esta proposta foi cancelada ou expirou. O local e o horário combinados não são mais
          válidos.
        </Text>
      ) : (
        <>
          <View style={styles.mapaWrap} pointerEvents="none">
            <MapView
              style={styles.mapa}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              liteMode
            >
              <Marker coordinate={{ latitude: lat, longitude: lng }} />
            </MapView>
          </View>

          <Text style={modalStyles.endereco}>
            {endereco || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`}
          </Text>

          <Text style={modalStyles.dataDeEntrega}>
            Entrega em: <Text style={modalStyles.dataDeEntregaNegrito}>{formatarDataDeEntrega(dataDeEntrega)}</Text>
          </Text>

          <Pressable onPress={abrirNoMapa} hitSlop={8} style={modalStyles.linkMapaArea}>
            <Text style={modalStyles.linkMapa}>Abrir no mapa</Text>
          </Pressable>
        </>
      )}

      {podeGerenciar && (
        <Pressable
          onPress={handleCancelar}
          disabled={cancelando || finalizando}
          style={({ pressed }) => [
            styles.btnCancelar,
            (cancelando || finalizando) && styles.btnDesabilitadoSuave,
            pressed && styles.pressionado,
          ]}
        >
          {cancelando ? (
            <ActivityIndicator color="#B3261E" size="small" />
          ) : (
            <Text style={styles.btnCancelarTexto}>Cancelar doação</Text>
          )}
        </Pressable>
      )}

      {!!erro && <Text style={modalStyles.erro}>{erro}</Text>}

      {podeGerenciar && (
        <Pressable
          onPress={() => setModalConfirmarAberto(true)}
          disabled={cancelando || finalizando}
          style={({ pressed }) => [
            styles.btnConfirmar,
            (cancelando || finalizando) && styles.btnConfirmarDesabilitado,
            pressed && styles.pressionado,
          ]}
        >
          <Text style={modalStyles.modalConfirmarTexto}>Confirmar doação</Text>
        </Pressable>
      )}

      {finalizada && <Text style={modalStyles.avisoConcluida}>✅ Animal entregue.</Text>}

      {modalConfirmarAberto && (
        <ModalConfirmarAdocao
          nomeAnimal={nomeAnimal}
          confirmando={finalizando}
          erro={erroFinalizar}
          onClose={() => setModalConfirmarAberto(false)}
          onConfirmar={handleConfirmarAdocao}
        />
      )}
    </View>
  );
}