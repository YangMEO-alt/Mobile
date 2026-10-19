// Instalar npx expo install react-native-maps expo-location

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, type MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { extrairMensagemErro } from "../../lib/api";
import {styles} from "../../styles/propostaAdocao";

export type Organizacao = {
  idOrganizacao: number;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
};

export type DadosProposta = {
  lat: number;
  lng: number;
  endereco: string | null;
  dataDeEntrega: string;
  idOrganizacaoAdotante: number | null;
};

type Props = {
  nomeAnimal?: string;
  onClose: () => void;
  onConfirmar: (dados: DadosProposta) => Promise<void>;
  modoResgate?: boolean;
  organizacoes?: Organizacao[] | null;
};

type Posicao = { lat: number; lng: number };

type ResultadoBusca = { lat: string; lon: string; display_name?: string };

const HEADERS_NOMINATIM = {
  Accept: "application/json",
  "Accept-Language": "pt-BR",
  "User-Agent": "AdotaPet-TCC/1.0",
};

const REGIAO_PADRAO = {
  latitude: -14.235,
  longitude: -51.9253,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

const pad = (n: number) => String(n).padStart(2, "0");

function formatarDataBR(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatarHoraBR(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function somarHorasAoAgora(horas: number) {
  const data = new Date();
  data.setSeconds(0, 0);
  data.setHours(data.getHours() + horas);
  return data;
}

function mascaraData(texto: string) {
  const d = texto.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function mascaraHora(texto: string) {
  const d = texto.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function interpretarDataHora(dataTexto: string, horaTexto: string): Date | null {
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataTexto);
  const h = /^(\d{2}):(\d{2})$/.exec(horaTexto);
  if (!d || !h) return null;

  const dia = Number(d[1]);
  const mes = Number(d[2]);
  const ano = Number(d[3]);
  const hora = Number(h[1]);
  const minuto = Number(h[2]);

  if (hora > 23 || minuto > 59) return null;

  const data = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }

  return data;
}

export default function ModalPropostaAdocao({
  nomeAnimal,
  onClose,
  onConfirmar,
  modoResgate = false,
  organizacoes = null,
}: Props) {
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [endereco, setEndereco] = useState("");
  const [buscandoEndereco, setBuscandoEndereco] = useState(false);
  const [dataTexto, setDataTexto] = useState(() => formatarDataBR(somarHorasAoAgora(1)));
  const [horaTexto, setHoraTexto] = useState(() => formatarHoraBR(somarHorasAoAgora(1)));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [idOrganizacaoSelecionada, setIdOrganizacaoSelecionada] = useState(
    organizacoes?.length === 1 ? String(organizacoes[0].idOrganizacao) : ""
  );

  const [textoBusca, setTextoBusca] = useState("");
  const [buscandoNoMapa, setBuscandoNoMapa] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const [mapaPronto, setMapaPronto] = useState(false);
  const [rolagemAtiva, setRolagemAtiva] = useState(true);

  const origemBuscaRef = useRef(false);
  const mapaRef = useRef<MapView>(null);
  const posicaoRef = useRef<Posicao | null>(null);

  const buscarEndereco = async () => {
    const consulta = textoBusca.trim();
    if (!consulta || buscandoNoMapa) return;

    setBuscandoNoMapa(true);
    setErroBusca(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(consulta)}`,
        { headers: HEADERS_NOMINATIM }
      );
      const resultados = (await res.json()) as ResultadoBusca[];

      if (!resultados || resultados.length === 0) {
        setErroBusca(
          "Endereço não encontrado. Tente ser mais específico ou marque o ponto direto no mapa."
        );
        return;
      }

      const { lat, lon, display_name } = resultados[0];
      origemBuscaRef.current = true;
      setEndereco(display_name || consulta);
      setPosicao({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } catch (err) {
      console.error("Erro ao buscar endereço", err);
      setErroBusca(
        "Não foi possível buscar esse endereço agora. Tente novamente ou marque no mapa."
      );
    } finally {
      setBuscandoNoMapa(false);
    }
  };

  useEffect(() => {
    if (!mapaPronto) return;

    let cancelado = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const atual = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelado || posicaoRef.current) return;

        mapaRef.current?.animateToRegion(
          {
            latitude: atual.coords.latitude,
            longitude: atual.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          600
        );
      } catch {
        // silencioso -- mantém o mapa no fallback
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [mapaPronto]);

  useEffect(() => {
    posicaoRef.current = posicao;
    if (!posicao) return;

    mapaRef.current?.animateToRegion(
      {
        latitude: posicao.lat,
        longitude: posicao.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  }, [posicao]);

  useEffect(() => {
    if (!posicao) return;

    if (origemBuscaRef.current) {
      origemBuscaRef.current = false;
      return;
    }

    let ativo = true;
    setBuscandoEndereco(true);
    setEndereco("");

    const controller = new AbortController();

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${posicao.lat}&lon=${posicao.lng}`,
      { signal: controller.signal, headers: HEADERS_NOMINATIM }
    )
      .then((res) => res.json() as Promise<{ display_name?: string }>)
      .then((data) => {
        if (ativo) setEndereco(data.display_name || "");
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setBuscandoEndereco(false);
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [posicao]);

  const handleToqueNoMapa = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPosicao({ lat: latitude, lng: longitude });
  };

  const faltaEscolherOrganizacao = modoResgate && !idOrganizacaoSelecionada;

  const dataEntrega = interpretarDataHora(dataTexto, horaTexto);
  const dataDeEntregaInvalida = !dataEntrega || dataEntrega.getTime() <= Date.now();
  const mostrarAvisoData = dataTexto.length === 10 && horaTexto.length === 5 && dataDeEntregaInvalida;

  const handleConfirmar = async () => {
    if (!posicao || enviando || faltaEscolherOrganizacao) return;

    if (!dataEntrega || dataDeEntregaInvalida) {
      setErro("Escolha uma data e hora de entrega no futuro.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      await onConfirmar({
        lat: posicao.lat,
        lng: posicao.lng,
        endereco: endereco || null,
        dataDeEntrega: dataEntrega.toISOString(),
        idOrganizacaoAdotante: modoResgate ? Number(idOrganizacaoSelecionada) : null,
      });
    } catch (err) {
      console.error("Erro ao confirmar proposta de doação", err);
      setErro(extrairMensagemErro(err, "Não foi possível enviar a proposta. Tente novamente."));
      setEnviando(false);
    }
  };

  const botaoDesabilitado = !posicao || enviando || faltaEscolherOrganizacao || dataDeEntregaInvalida;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.fundo}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Text style={styles.titulo} numberOfLines={2}>
              {modoResgate ? "Aceitar recebimento" : "Aceitar doação"}
              {nomeAnimal ? ` de ${nomeAnimal}` : ""}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} disabled={enviando} accessibilityLabel="Fechar">
              <Text style={styles.fechar}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.conteudo}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={rolagemAtiva}
          >
            <Text style={styles.subtitulo}>
              {modoResgate
                ? "Digite o endereço do ponto de encontro ou toque no mapa para marcá-lo, e escolha a data e a hora em que o tutor deve levar o animal até lá."
                : "Digite o endereço do ponto de encontro ou toque no mapa para marcá-lo, e escolha a data e a hora em que o adotante deve buscar o animal."}
            </Text>

            {modoResgate && !!organizacoes && organizacoes.length > 1 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Aceitar em nome de:</Text>
                {organizacoes.map((org) => {
                  const selecionada = idOrganizacaoSelecionada === String(org.idOrganizacao);
                  return (
                    <Pressable
                      key={org.idOrganizacao}
                      onPress={() => setIdOrganizacaoSelecionada(String(org.idOrganizacao))}
                      style={[styles.opcaoOrg, selecionada && styles.opcaoOrgAtiva]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selecionada }}
                    >
                      <View style={[styles.radio, selecionada && styles.radioAtivo]}>
                        {selecionada && <View style={styles.radioMiolo} />}
                      </View>
                      <Text style={styles.opcaoOrgTexto}>
                        {org.nomeFantasia || org.razaoSocial}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.buscaLinha}>
              <TextInput
                style={[styles.input, styles.buscaInput]}
                placeholder="Ex: Rua Nome Exemplo, 140, São Paulo"
                placeholderTextColor="#9A8F85"
                value={textoBusca}
                onChangeText={setTextoBusca}
                editable={!buscandoNoMapa}
                returnKeyType="search"
                onSubmitEditing={buscarEndereco}
              />
              <Pressable
                onPress={buscarEndereco}
                disabled={!textoBusca.trim() || buscandoNoMapa}
                style={({ pressed }) => [
                  styles.buscaBotao,
                  (!textoBusca.trim() || buscandoNoMapa) && styles.buscaBotaoDesabilitado,
                  pressed && styles.pressionado,
                ]}
              >
                {buscandoNoMapa ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buscaBotaoTexto}>Buscar</Text>
                )}
              </Pressable>
            </View>
            {!!erroBusca && <Text style={styles.erroTexto}>{erroBusca}</Text>}

            <View
              style={styles.mapaWrap}
              onTouchStart={() => setRolagemAtiva(false)}
              onTouchEnd={() => setRolagemAtiva(true)}
              onTouchCancel={() => setRolagemAtiva(true)}
            >
              <MapView
                ref={mapaRef}
                style={styles.mapa}
                initialRegion={REGIAO_PADRAO}
                onMapReady={() => setMapaPronto(true)}
                onPress={handleToqueNoMapa}
              >
                {posicao && (
                  <Marker coordinate={{ latitude: posicao.lat, longitude: posicao.lng }} />
                )}
              </MapView>
            </View>

            <View style={styles.enderecoPreview}>
              {!posicao && (
                <Text style={styles.enderecoPlaceholder}>Nenhum local selecionado ainda</Text>
              )}
              {posicao && buscandoEndereco && (
                <Text style={styles.enderecoTexto}>Buscando endereço...</Text>
              )}
              {posicao && !buscandoEndereco && (
                <Text style={styles.enderecoTexto}>
                  {endereco || `Lat ${posicao.lat.toFixed(5)}, Lng ${posicao.lng.toFixed(5)}`}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Data e hora da entrega do animal</Text>
              <View style={styles.dataLinha}>
                <TextInput
                  style={[styles.input, styles.dataInput]}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#9A8F85"
                  value={dataTexto}
                  onChangeText={(t) => setDataTexto(mascaraData(t))}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TextInput
                  style={[styles.input, styles.horaInput]}
                  placeholder="HH:MM"
                  placeholderTextColor="#9A8F85"
                  value={horaTexto}
                  onChangeText={(t) => setHoraTexto(mascaraHora(t))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              {mostrarAvisoData && (
                <Text style={styles.erroTexto}>
                  Escolha uma data e hora de entrega no futuro.
                </Text>
              )}
            </View>

            {!!erro && <Text style={styles.erroCaixa}>{erro}</Text>}
          </ScrollView>

          <View style={styles.rodape}>
            <Pressable
              onPress={onClose}
              disabled={enviando}
              style={({ pressed }) => [
                styles.btnCancelar,
                enviando && styles.btnDesabilitadoSuave,
                pressed && styles.pressionado,
              ]}
            >
              <Text style={styles.btnCancelarTexto}>Cancelar</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmar}
              disabled={botaoDesabilitado}
              style={({ pressed }) => [
                styles.btnConfirmar,
                botaoDesabilitado && styles.btnConfirmarDesabilitado,
                pressed && styles.pressionado,
              ]}
            >
              {enviando ? (
                <View style={styles.btnLinha}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.btnConfirmarTexto}>Enviando...</Text>
                </View>
              ) : (
                <Text style={styles.btnConfirmarTexto}>
                  {modoResgate ? "Confirmar recebimento" : "Confirmar doação"}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}