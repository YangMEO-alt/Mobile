import { SetStateAction, useEffect, useState } from "react";
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
  Switch,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { api } from "../../lib/api";
import { styles } from "../../styles/style.home";

type Endereco = {
  municipio?: string;
  estado?: string;
};

type Dono = {
  firebaseUid?: string;
  nome?: string;
  foto?: string | null;
  endereco?: Endereco;
};

export type Animal = {
  idAnimal: number;
  nome: string;
  especie?: { nome: string };
  raca?: string | null;
  idade: number;
  porte: string;
  sexo: string;
  descricao: string;
  foto?: string | null;
  usuario?: Dono;
  firebaseUidUsuario?: string;
  nomeUsuario?: string;
  fotoUsuario?: string | null;
};

type Especie = { nome: string };
type Cor = { idCor: number; corNome: string };

type OpcoesFiltro = {
  especies: string[];
  portes: string[];
  cores: Cor[];
};

type Filtros = {
  especie: string;
  porte: string;
  sexo: string;
  cores: number[];
  idade: string;
  pertoDeMim: boolean;
};

type CampoTexto = "especie" | "porte" | "sexo" | "idade";

export type ContatoAdocao = {
  uid: string | undefined;
  displayName: string;
  photoURL: string | null;
  idAnimal: number;
  nomeAnimal: string;
};

type Props = {
  usuarioLogado?: boolean;
  acessoNegado?: boolean;
  onVerAnimal?: (animal: Animal) => void;
  onAdotar?: (contato: ContatoAdocao) => void;
  onDenunciar?: (animal: Animal) => void;
};

const FAIXAS_IDADE = [
  { valor: "filhote", label: "Filhote (até 1 ano)", min: 0, max: 1 },
  { valor: "jovem", label: "Jovem (2 a 4 anos)", min: 2, max: 4 },
  { valor: "adulto", label: "Adulto (5 a 8 anos)", min: 5, max: 8 },
  { valor: "idoso", label: "Idoso (9+ anos)", min: 9, max: null },
];

const FILTROS_VAZIOS: Filtros = {
  especie: "",
  porte: "",
  sexo: "",
  cores: [],
  idade: "",
  pertoDeMim: false,
};

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
  onVerAnimal,
  onAdotar,
  onDenunciar,
}: Props) {
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [search, setSearch] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [acessoNegado, setAcessoNegado] = useState(acessoNegadoInicial);
  const [opcoesFiltro, setOpcoesFiltro] = useState<OpcoesFiltro>({
    especies: [],
    portes: [],
    cores: [],
  });

  const atualizarFiltro = <K extends keyof Filtros>(campo: K, valor: Filtros[K]) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const alternarOpcao = (campo: CampoTexto, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: prev[campo] === valor ? "" : valor }));
  };

  const alternarCor = (idCor: number) => {
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
      if (chave === "cores") return (valor as number[]).length > 0;
      if (chave === "pertoDeMim") return valor === true;
      return valor !== "";
    }) || search !== "";

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.allSettled([
      api<Especie[]>("/especies"),
      api<string[]>("/animal/portes-disponiveis"),
      api<Cor[]>("/cores-animal"),
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
        especies: especiesRes.status === "fulfilled" ? especiesRes.value.map((e: { nome: any; }) => e.nome) : [],
        portes: portesRes.status === "fulfilled" ? portesRes.value : [],
        cores: coresRes.status === "fulfilled" ? coresRes.value : [],
      });
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);

    const params: Record<string, string | number | boolean | number[]> = {};
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

    api<Animal[]>("/animal", { params, signal: controller.signal })
      .then((dados: SetStateAction<Animal[]>) => {
        setAnimais(Array.isArray(dados) ? dados : []);
        setCarregando(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        console.error("Erro ao buscar animais", err);
        setCarregando(false);
      });

    return () => controller.abort();
  }, [filtros, buscaDebounced]);

  const pedirAuth = (acao: () => void, motivo: "adotar" | "generico") => {
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

  const handleVerAnimal = (animal: Animal) => {
    if (onVerAnimal) onVerAnimal(animal);
    else Alert.alert(animal.nome, "Aqui abriria a tela de detalhes do animal.");
  };

  const handleAdotar = (animal: Animal) => {
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

  const handleDenunciar = (animal: Animal) => {
    pedirAuth(() => {
      if (onDenunciar) onDenunciar(animal);
      else Alert.alert("Denunciar", `Aqui abriria o formulário de denúncia de ${animal.nome}.`);
    }, "generico");
  };

  const estiloBadgeSexo = (sexo?: string) => {
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

  const renderAnimal: ListRenderItem<Animal> = ({ item: animal }) => (
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
  )};