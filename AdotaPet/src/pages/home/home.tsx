import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const FAIXAS_IDADE = [
  { valor: "filhote", label: "Filhote (até 1 ano)", min: 0, max: 1 },
  { valor: "jovem", label: "Jovem (2 a 4 anos)", min: 2, max: 4 },
  { valor: "adulto", label: "Adulto (5 a 8 anos)", min: 5, max: 8 },
  { valor: "idoso", label: "Idoso (9+ anos)", min: 9, max: null },
];

const FILTROS_VAZIOS = {
  especie: "",
  porte: "",
  sexo: "",
  cores: [] as number[],
  idade: "",
  pertoDeMim: false,
};

const API_URL = "http://SEU_IP_AQUI:3001";

function montarQuery(params: Record<string, string | number | boolean | (string | number | boolean)[]>) {
  const partes: string[] = [];
  Object.entries(params).forEach(([chave, valor]) => {
    if (Array.isArray(valor)) {
      valor.forEach((item) =>
        partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(item)}`)
      );
    } else {
      partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`);
    }
  });
  return partes.length > 0 ? `?${partes.join("&")}` : "";
}

async function requisitar(caminho: string, { params = {}, signal, obterToken }: { params?: Record<string, string | number | boolean | (string | number | boolean)[]>; signal?: AbortSignal; obterToken?: () => Promise<string | null> } = {}) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (obterToken) {
    const token = await obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}${montarQuery(params)}`, {
    headers,
    signal,
  });

  if (!resposta.ok) {
    const erro = Object.assign(new Error(`HTTP ${resposta.status} em ${caminho}`), {
      status: resposta.status,
    });
    throw erro;
  }

  return resposta.json();
}

function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, ativo && styles.chipAtivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
    >
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{label}</Text>
    </Pressable>
  );
}

function GrupoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.filtroGrupo}>
      <Text style={styles.filtroLabel}>{titulo}</Text>
      <View style={styles.chipsLinha}>{children}</View>
    </View>
  );
}

export default function HomeScreen({
  usuarioLogado = false,
  acessoNegado: acessoNegadoInicial = false,
  obterToken,
  onVerAnimal,
  onAdotar,
  onDenunciar,
}: {
  usuarioLogado?: boolean;
  acessoNegado?: boolean;
  obterToken?: () => Promise<string | null>;
  onVerAnimal?: (animal: any) => void;
  onAdotar?: (animal: any) => void;
  onDenunciar?: (animal: any) => void;
}) {
  const [animais, setAnimais] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [search, setSearch] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [acessoNegado, setAcessoNegado] = useState(acessoNegadoInicial);
  const [opcoesFiltro, setOpcoesFiltro] = useState<{
    especies: string[];
    portes: string[];
    cores: { idCor: number; corNome: string }[];
  }>({
    especies: [],
    portes: [],
    cores: [],
  });

  const atualizarFiltro = (campo: keyof typeof FILTROS_VAZIOS, valor: (typeof FILTROS_VAZIOS)[keyof typeof FILTROS_VAZIOS]) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const alternarOpcao = (
    campo: Exclude<keyof typeof FILTROS_VAZIOS, "cores">,
    valor: (typeof FILTROS_VAZIOS)[Exclude<keyof typeof FILTROS_VAZIOS, "cores">],
  ) => {
    setFiltros((prev) => ({ ...prev, [campo]: prev[campo] === valor ? "" : valor }));
  };

  const alternarCor = (idCor: (typeof FILTROS_VAZIOS)["cores"][number]) => {
    setFiltros((prev) => ({
      ...prev,
      cores: prev.cores.includes(idCor)
        ? prev.cores.filter((id) => id !== idCor)
        : [...prev.cores, idCor],
    }));
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_VAZIOS);
    setSearch("");
  };

  const filtrosAtivos =
    Object.entries(filtros).some(([chave, valor]) => {
      if (chave === "cores") return Array.isArray(valor) && valor.length > 0;
      if (chave === "pertoDeMim") return valor === true;
      return valor !== "";
    }) || search !== "";

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.allSettled([
      requisitar("/especies", { obterToken }),
      requisitar("/animal/portes-disponiveis", { obterToken }),
      requisitar("/cores-animal", { obterToken }),
    ]).then(([especiesRes, portesRes, coresRes]) => {
      if (especiesRes.status === "rejected") {
        console.error("Erro ao buscar espécies", especiesRes.reason);
      }
      if (portesRes.status === "rejected") {
        console.error("Erro ao buscar portes", portesRes.reason);
      }
      if (coresRes.status === "rejected") {
        console.error("Erro ao buscar cores", coresRes.reason);
      }
      setOpcoesFiltro({
        especies:
          especiesRes.status === "fulfilled" ? especiesRes.value.map((e: { nome: string }) => e.nome) : [],
        portes: portesRes.status === "fulfilled" ? portesRes.value : [],
        cores: coresRes.status === "fulfilled" ? coresRes.value : [],
      });
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);

    const params: Record<string, string | boolean | string[] | number | number[]> = {};
    if (filtros.especie) params.especie = filtros.especie;
    if (filtros.porte) params.porte = filtros.porte;
    if (filtros.cores.length > 0) params.cores = filtros.cores;
    if (filtros.sexo) params.sexo = filtros.sexo;
    if (filtros.pertoDeMim) params.pertoDeMim = true;
    if (buscaDebounced) params.busca = buscaDebounced;
    if (filtros.idade) {
      const faixa = FAIXAS_IDADE.find((f) => f.valor === filtros.idade);
      if (faixa) {
        params.idadeMinima = faixa.min;
        if (faixa.max !== null) params.idadeMaxima = faixa.max;
      }
    }

    requisitar("/animal", { params, signal: controller.signal, obterToken })
      .then((dados) => {
        setAnimais(Array.isArray(dados) ? dados : []);
        setCarregando(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Erro ao buscar animais", err);
        setCarregando(false);
      });

    return () => controller.abort();
  }, [filtros, buscaDebounced]);

  const pedirAuth = (acao: () => void, motivo?: string) => {
    if (usuarioLogado) {
      acao();
      return;
    }
    Alert.alert(
      "Login necessário",
      motivo === "adotar"
        ? "Entre na sua conta para falar com o tutor e adotar."
        : "Entre na sua conta para continuar."
    );
  };

  const handleVerAnimal = (animal: (typeof animais)[number]) => {
    if (onVerAnimal) onVerAnimal(animal);
    else Alert.alert(animal.nome, "Aqui abriria a tela de detalhes do animal.");
  };

  const handleAdotar = (animal: (typeof animais)[number]) => {
    const uidDono = animal.usuario?.firebaseUid ?? animal.firebaseUidUsuario;
    const nomeDono = animal.usuario?.nome ?? animal.nomeUsuario;
    const fotoDono = animal.usuario?.foto ?? animal.fotoUsuario;

    pedirAuth(() => {
      if (onAdotar) {
        onAdotar({
          uid: uidDono,
          displayName: nomeDono || "Tutor",
          photoURL: fotoDono || null,
          idAnimal: animal.idAnimal,
          nomeAnimal: animal.nome,
        });
      } else {
        Alert.alert("Adotar", `Aqui abriria o chat com ${nomeDono || "o tutor"} sobre ${animal.nome}.`);
      }
    }, "adotar");
  };

  const handleDenunciar = (animal: (typeof animais)[number]) => {
    pedirAuth(() => {
      if (onDenunciar) onDenunciar(animal);
      else Alert.alert("Denunciar", `Aqui abriria o formulário de denúncia de ${animal.nome}.`);
    }, "generico");
  };

  const estiloBadgeSexo = (sexo: string | null | undefined) => {
    const normalizado = sexo?.toLowerCase();
    if (normalizado === "macho") return styles.badgeMacho;
    if (normalizado === "fêmea" || normalizado === "femea") return styles.badgeFemea;
    return null;
  };

  const cabecalho = (
    <View>
      {acessoNegado && (
        <View style={styles.alertaAcessoNegado} accessibilityRole="alert">
          <Text style={styles.alertaTexto}>Você não tem permissão para acessar essa área.</Text>
          <Pressable
            onPress={() => setAcessoNegado(false)}
            hitSlop={10}
            accessibilityLabel="Fechar aviso"
          >
            <Text style={styles.alertaFechar}>×</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.hero}>
        <Text style={styles.heroTitulo}>Animais para adoção</Text>
        <Text style={styles.heroSubtitulo}>Encontre um novo amigo esperando por um lar</Text>

        <TextInput
          style={styles.busca}
          placeholder="Procurar por nome, espécie ou raça..."
          placeholderTextColor="#9A8F85"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      <Pressable
        onPress={() => setFiltrosAbertos(true)}
        style={({ pressed }) => [styles.botaoFiltrar, pressed && styles.pressionado]}
        accessibilityRole="button"
      >
        <Text style={styles.botaoFiltrarTexto}>🔎 Filtrar</Text>
        {filtrosAtivos && <View style={styles.filtrosAtivosIndicador} />}
      </Pressable>
    </View>
  );

  const vazio = carregando ? (
    <View style={styles.estadoVazio}>
      <ActivityIndicator color="#C2571A" />
      <Text style={styles.estadoVazioTexto}>Carregando animais...</Text>
    </View>
  ) : (
    <View style={styles.estadoVazio}>
      <Text style={styles.estadoVazioTexto}>Nenhum animal encontrado.</Text>
    </View>
  );

  const renderAnimal = ({ item: animal }: { item: (typeof animais)[number] }) => (
    <Pressable
      onPress={() => handleVerAnimal(animal)}
      style={({ pressed }) => [styles.card, pressed && styles.pressionado]}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${animal.nome}`}
    >
      {animal.foto ? (
        <Image source={{ uri: animal.foto }} style={styles.cardImagem} />
      ) : (
        <View style={styles.cardImagemPlaceholder}>
          <Text style={styles.cardImagemEmoji}>🐾</Text>
        </View>
      )}

      <View style={styles.cardCorpo}>
        <Text style={styles.cardNome}>{animal.nome}</Text>
        <Text style={styles.cardRaca}>
          {animal.especie?.nome || "Espécie não informada"}
          {animal.raca ? ` · ${animal.raca}` : ""}
        </Text>

        {animal.usuario?.endereco?.municipio && animal.usuario?.endereco?.estado && (
          <Text style={styles.cardLocalizacao}>
            📍 {animal.usuario.endereco.municipio}, {animal.usuario.endereco.estado}
          </Text>
        )}

        <View style={styles.badgeLinha}>
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{animal.idade} anos</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>{animal.porte}</Text>
          </View>
          <View style={[styles.badge, estiloBadgeSexo(animal.sexo)]}>
            <Text style={styles.badgeTexto}>{animal.sexo}</Text>
          </View>
        </View>

        <Text style={styles.cardDescricao}>{animal.descricao}</Text>

        <Pressable
          onPress={() => handleAdotar(animal)}
          style={({ pressed }) => [styles.botaoAdotar, pressed && styles.pressionado]}
        >
          <Text style={styles.botaoAdotarTexto}>Adotar</Text>
        </Pressable>
        <Pressable
          onPress={() => handleDenunciar(animal)}
          style={({ pressed }) => [styles.botaoDenunciar, pressed && styles.pressionado]}
        >
          <Text style={styles.botaoDenunciarTexto}>Denunciar</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.fundo}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF4E6" />

      <FlatList
        data={carregando ? [] : animais}
        keyExtractor={(animal) => String(animal.idAnimal)}
        renderItem={renderAnimal}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={vazio}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={filtrosAbertos}
        animationType="slide"
        onRequestClose={() => setFiltrosAbertos(false)}
      >
        <SafeAreaView style={styles.modalFundo}>
          <View style={styles.filtrosHeader}>
            <Text style={styles.filtrosTitulo}>Filtros</Text>
            <View style={styles.filtrosHeaderAcoes}>
              {filtrosAtivos && (
                <Pressable onPress={limparFiltros} hitSlop={8}>
                  <Text style={styles.filtrosLimpar}>Limpar</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => setFiltrosAbertos(false)}
                hitSlop={10}
                accessibilityLabel="Fechar filtros"
              >
                <Text style={styles.filtrosFechar}>×</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.filtrosConteudo}>
            {usuarioLogado && (
              <View style={styles.toggleLinha}>
                <Text style={styles.toggleTexto}>Na minha cidade</Text>
                <Switch
                  value={filtros.pertoDeMim}
                  onValueChange={(valor) => atualizarFiltro("pertoDeMim", valor)}
                  trackColor={{ false: "#E3D5C6", true: "#E8A77C" }}
                  thumbColor={filtros.pertoDeMim ? "#C2571A" : "#FFFFFF"}
                />
              </View>
            )}

            <GrupoFiltro titulo="Espécie">
              {opcoesFiltro.especies.map((especie) => (
                <Chip
                  key={especie}
                  label={especie}
                  ativo={filtros.especie === especie}
                  onPress={() => alternarOpcao("especie", especie)}
                />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Sexo">
              {["Macho", "Fêmea"].map((opcao) => (
                <Chip
                  key={opcao}
                  label={opcao}
                  ativo={filtros.sexo === opcao}
                  onPress={() => alternarOpcao("sexo", opcao)}
                />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Porte">
              {opcoesFiltro.portes.map((porte) => (
                <Chip
                  key={porte}
                  label={porte}
                  ativo={filtros.porte === porte}
                  onPress={() => alternarOpcao("porte", porte)}
                />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Cor">
              {opcoesFiltro.cores.map((cor) => (
                <Chip
                  key={cor.idCor}
                  label={cor.corNome}
                  ativo={filtros.cores.includes(cor.idCor)}
                  onPress={() => alternarCor(cor.idCor)}
                />
              ))}
            </GrupoFiltro>

            <GrupoFiltro titulo="Idade">
              {FAIXAS_IDADE.map((faixa) => (
                <Chip
                  key={faixa.valor}
                  label={faixa.label}
                  ativo={filtros.idade === faixa.valor}
                  onPress={() => alternarOpcao("idade", faixa.valor)}
                />
              ))}
            </GrupoFiltro>
          </ScrollView>

          <View style={styles.filtrosRodape}>
            <Pressable
              onPress={() => setFiltrosAbertos(false)}
              style={({ pressed }) => [styles.filtrosAplicar, pressed && styles.pressionado]}
            >
              <Text style={styles.filtrosAplicarTexto}>Ver resultados</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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