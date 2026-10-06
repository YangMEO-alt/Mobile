import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { styles } from "../../styles/style.cadastro";
// import { api, ErroHttp } from "../lib/api";

const IDADE_MINIMA = 18;

const ETAPAS = [{ titulo: "Sua conta" }, { titulo: "Seus dados" }, { titulo: "Onde você mora" }];

type ItemLookup = { id: number; nome: string };
type Estado = { id: number; sigla: string; nome: string };
type Municipio = { id: number; nome: string };
type UsuarioApi = {
  idUsuario: number;
  nome: string;
  foto: string | null;
  perfil: string;
};
type Opcao = { valor: string; rotulo: string };

export type ContaCriada = {
  uid: string;
  desfazer: () => Promise<void>;
};

export type UsuarioCadastrado = {
  id: number;
  firebaseUid: string;
  nome: string;
  foto: string | null;
  perfil: string;
};

type Props = {
  criarConta: (email: string, senha: string) => Promise<ContaCriada>;
  onCadastroConcluido: (usuario: UsuarioCadastrado) => void | Promise<void>;
  onLogin?: () => void;
  fotoPadrao?: string | null;
};

function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function cpfValido(cpfDigitado: string) {
  const cpf = cpfDigitado.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitos = cpf.split("").map(Number);

  let soma1 = 0;
  for (let i = 0; i < 9; i++) soma1 += digitos[i] * (10 - i);
  const resto1 = soma1 % 11;
  const dv1 = resto1 < 2 ? 0 : 11 - resto1;
  if (dv1 !== digitos[9]) return false;

  let soma2 = 0;
  for (let i = 0; i < 10; i++) soma2 += digitos[i] * (11 - i);
  const resto2 = soma2 % 11;
  const dv2 = resto2 < 2 ? 0 : 11 - resto2;
  return dv2 === digitos[10];
}

function telefoneValido(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  const semPais = digitos.length > 11 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
  if (semPais.length !== 10 && semPais.length !== 11) return false;
  const ddd = Number(semPais.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (semPais.length === 11) return semPais[2] === "9";
  return semPais[2] !== "0" && semPais[2] !== "1";
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function formatarData(texto: string) {
  const d = texto.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

type DataInterpretada = { dia: number; mes: number; ano: number; iso: string };

function interpretarData(texto: string): DataInterpretada | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const teste = new Date(ano, mes - 1, dia);

  if (teste.getFullYear() !== ano || teste.getMonth() !== mes - 1 || teste.getDate() !== dia) {
    return null;
  }
  if (ano < 1900) return null;

  return { dia, mes, ano, iso: `${m[3]}-${m[2]}-${m[1]}` };
}

function idadeEmAnos(data: DataInterpretada) {
  const hoje = new Date();
  let idade = hoje.getFullYear() - data.ano;
  const aindaNaoFezAniversario =
    hoje.getMonth() + 1 < data.mes || (hoje.getMonth() + 1 === data.mes && hoje.getDate() < data.dia);
  if (aindaNaoFezAniversario) idade--;
  return idade;
}

function mensagemErroFirebase(code?: string) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    default:
      return null;
  }
}

function extrairMensagemErro(error: unknown) {
  if (error instanceof ErroHttp) {
    const dados = error.dados;

    if (typeof dados === "string" && dados.trim()) return dados;

    if (dados && typeof dados === "object") {
      const objeto = dados as Record<string, unknown>;
      for (const chave of ["message", "mensagem", "erro", "error"]) {
        const valor = objeto[chave];
        if (typeof valor === "string" && valor.trim()) return valor;
      }
    }

    if (error.status === 401 || error.status === 403) {
      return "Você não tem permissão para fazer isso. Entre na sua conta e tente novamente.";
    }
  }

  if (error instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  return "Erro ao conectar com o servidor.";
}

function Campo({ rotulo, erro, children }: { rotulo: string; erro?: string; children: ReactNode }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{rotulo}</Text>
      {children}
      {!!erro && <Text style={styles.erroCampo}>{erro}</Text>}
    </View>
  );
}

function Checkbox({
  marcado,
  onChange,
  children,
}: {
  marcado: boolean;
  onChange: (valor: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={() => onChange(!marcado)}
      style={styles.checkboxLinha}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
    >
      <View style={[styles.checkboxCaixa, marcado && styles.checkboxCaixaMarcada]}>
        {marcado && <Text style={styles.checkboxMarca}>✓</Text>}
      </View>
      <Text style={styles.checkboxTexto}>{children}</Text>
    </Pressable>
  );
}

function Seletor({
  titulo,
  placeholder,
  opcoes,
  valor,
  onChange,
  desabilitado = false,
  buscavel = false,
}: {
  titulo: string;
  placeholder: string;
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
  desabilitado?: boolean;
  buscavel?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");

  const selecionada = opcoes.find((opcao) => opcao.valor === valor);
  const termoLimpo = semAcento(termo.trim());
  const filtradas = termoLimpo
    ? opcoes.filter((opcao) => semAcento(opcao.rotulo).includes(termoLimpo))
    : opcoes;

  const fechar = () => {
    setAberto(false);
    setTermo("");
  };

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        disabled={desabilitado}
        style={[styles.seletor, desabilitado && styles.seletorDesabilitado]}
        accessibilityRole="button"
      >
        <Text
          style={[styles.seletorTexto, !selecionada && styles.seletorPlaceholder]}
          numberOfLines={1}
        >
          {selecionada ? selecionada.rotulo : placeholder}
        </Text>
        <Text style={styles.seletorSeta}>▾</Text>
      </Pressable>

      <Modal visible={aberto} animationType="slide" onRequestClose={fechar}>
        <SafeAreaView style={styles.modalFundo}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>{titulo}</Text>
            <Pressable onPress={fechar} hitSlop={10} accessibilityLabel="Fechar">
              <Text style={styles.modalFechar}>×</Text>
            </Pressable>
          </View>

          {buscavel && (
            <View style={styles.modalBuscaArea}>
              <TextInput
                style={styles.input}
                placeholder="Buscar..."
                placeholderTextColor="#9A8F85"
                value={termo}
                onChangeText={setTermo}
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            data={filtradas}
            keyExtractor={(opcao) => opcao.valor}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.modalVazio}>Nenhuma opção encontrada.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.valor);
                  fechar();
                }}
                style={({ pressed }) => [styles.modalItem, pressed && styles.pressionado]}
              >
                <Text
                  style={[styles.modalItemTexto, item.valor === valor && styles.modalItemSelecionado]}
                >
                  {item.rotulo}
                </Text>
                {item.valor === valor && <Text style={styles.modalItemMarca}>✓</Text>}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default function Cadastro({
  criarConta,
  onCadastroConcluido,
  onLogin,
  fotoPadrao = null,
}: Props) {
  const [etapaAtual, setEtapaAtual] = useState(0);

  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [tel, setTel] = useState("");
  const [telErro, setTelErro] = useState("");

  const [dataTexto, setDataTexto] = useState("");
  const [idadeErro, setIdadeErro] = useState("");

  const [tiposResidencia, setTiposResidencia] = useState<ItemLookup[]>([]);
  const [tamanhosResidencia, setTamanhosResidencia] = useState<ItemLookup[]>([]);
  const [idTipoResidencia, setIdTipoResidencia] = useState("");
  const [idTamanhoResidencia, setIdTamanhoResidencia] = useState("");

  const [possuiOutrosAnimais, setPossuiOutrosAnimais] = useState(false);
  const [outrosAnimaisDescricao, setOutrosAnimaisDescricao] = useState("");
  const [cienteCustosVeterinarios, setCienteCustosVeterinarios] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  useEffect(() => {
    let cancelado = false;

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json() as Promise<Estado[]>)
      .then((dados) => {
        if (!cancelado) setEstados(dados);
      })
      .catch((err) => console.error("Erro ao buscar estados", err));

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!estado) {
      setMunicipios([]);
      return;
    }

    let cancelado = false;
    setCarregandoMunicipios(true);

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
      .then((res) => res.json() as Promise<Municipio[]>)
      .then((dados) => {
        if (!cancelado) {
          setMunicipios([...dados].sort((a, b) => a.nome.localeCompare(b.nome)));
        }
      })
      .catch((err) => console.error("Erro ao buscar municípios", err))
      .finally(() => {
        if (!cancelado) setCarregandoMunicipios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [estado]);

  useEffect(() => {
    api<ItemLookup[]>("/tipos-residencia")
      .then(setTiposResidencia)
      .catch((err) => console.error("Erro ao buscar tipos de residência", err));

    api<ItemLookup[]>("/tamanhos-residencia")
      .then(setTamanhosResidencia)
      .catch((err) => console.error("Erro ao buscar tamanhos de residência", err));
  }, []);

  const handleTelChange = (valor: string) => {
    setTel(valor);

    if (!valor.trim()) {
      setTelErro("");
      return;
    }

    setTelErro(
      telefoneValido(valor) ? "" : "Telefone inválido -- confira o DDD e a quantidade de dígitos."
    );
  };

  const mensagemIdade = (data: DataInterpretada | null) => {
    if (!data) return "Data inválida.";
    if (idadeEmAnos(data) < IDADE_MINIMA) {
      return `É necessário ter pelo menos ${IDADE_MINIMA} anos para se cadastrar.`;
    }
    return "";
  };

  const handleDataChange = (texto: string) => {
    const formatado = formatarData(texto);
    setDataTexto(formatado);

    if (formatado.length < 10) {
      setIdadeErro("");
      return;
    }

    setIdadeErro(mensagemIdade(interpretarData(formatado)));
  };

  const handleEstadoChange = (sigla: string) => {
    setEstado(sigla);
    setMunicipio("");
  };

  const validarEtapa = (indice: number): string | null => {
    if (indice === 0) {
      if (!nome.trim()) return "Digite seu nome.";
      if (!email.trim()) return "Digite seu email.";
      if (!emailValido(email)) return "E-mail inválido.";
      if (!senha) return "Digite uma senha.";
      if (senha.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
      if (senha !== confirmarSenha) return "As senhas não coincidem.";
      return null;
    }

    if (indice === 1) {
      if (!cpfValido(cpf)) return "CPF inválido.";
      if (tel.trim() && !telefoneValido(tel)) {
        return "Telefone inválido -- confira o DDD e a quantidade de dígitos.";
      }
      if (!dataTexto) return "Informe sua data de nascimento.";
      const erroIdade = mensagemIdade(interpretarData(dataTexto));
      if (erroIdade) return erroIdade;
      if (!cienteCustosVeterinarios) {
        return "É necessário confirmar ciência dos custos de manter um animal.";
      }
      return null;
    }

    if (!idTipoResidencia) return "Selecione o tipo de residência.";
    if (!idTamanhoResidencia) return "Selecione o tamanho da residência.";
    if (!estado) return "Selecione seu estado.";
    if (!municipio) return "Selecione seu município.";
    return null;
  };

  const irParaProximaEtapa = async () => {
    const erroEtapa = validarEtapa(etapaAtual);
    if (erroEtapa) {
      showMessage(erroEtapa, true);
      return;
    }

    setVerificando(true);

    try {
      if (etapaAtual === 0) {
        const emailJaUsado = await api<boolean>("/usuario/existe-email", {
          params: { email: email.trim() },
        });
        if (emailJaUsado) {
          showMessage("Este email já está cadastrado.", true);
          return;
        }
      }

      if (etapaAtual === 1) {
        const cpfJaUsado = await api<boolean>("/usuario/existe-cpf", { params: { cpf } });
        if (cpfJaUsado) {
          showMessage("Este CPF já está cadastrado.", true);
          return;
        }
      }
    } catch (error) {
      console.log(error);
      showMessage(extrairMensagemErro(error), true);
      return;
    } finally {
      setVerificando(false);
    }

    showMessage("");
    setEtapaAtual((atual) => Math.min(atual + 1, ETAPAS.length - 1));
  };

  const voltarEtapa = () => {
    showMessage("");
    setEtapaAtual((atual) => Math.max(atual - 1, 0));
  };

  const concluirCadastro = async () => {
    const erroEtapa = validarEtapa(2);
    if (erroEtapa) {
      showMessage(erroEtapa, true);
      return;
    }

    const data = interpretarData(dataTexto);
    if (!data) {
      showMessage("Data inválida.", true);
      return;
    }

    setEnviando(true);
    showMessage("");

    let conta: ContaCriada;
    try {
      conta = await criarConta(email.trim(), senha);
    } catch (error) {
      const code = (error as { code?: string }).code;
      showMessage(
        mensagemErroFirebase(code) || "Não foi possível criar sua conta agora. Tente novamente.",
        true
      );
      setEnviando(false);
      return;
    }

    let usuario: UsuarioApi;
    try {
      usuario = await api<UsuarioApi>("/usuario", {
        method: "POST",
        body: {
          nome: nome.trim(),
          email: email.trim(),
          cpf,
          telefone: tel,
          estado,
          municipio,
          foto: fotoPadrao,
          dataDeNascimento: data.iso,
          idTipoResidencia: Number(idTipoResidencia),
          idTamanhoResidencia: Number(idTamanhoResidencia),
          possuiOutrosAnimais,
          outrosAnimaisDescricao: possuiOutrosAnimais ? outrosAnimaisDescricao : null,
          cienteCustosVeterinarios,
        },
      });
    } catch (error) {
      console.log(error);
      showMessage(extrairMensagemErro(error), true);

      try {
        await conta.desfazer();
      } catch (erroLimpeza) {
        console.error("Falha ao desfazer conta do Firebase após erro no cadastro", erroLimpeza);
      }

      setEnviando(false);
      return;
    }

    showMessage("Cadastro realizado com sucesso!");

    try {
      await onCadastroConcluido({
        id: usuario.idUsuario,
        firebaseUid: conta.uid,
        nome: usuario.nome,
        foto: usuario.foto,
        perfil: usuario.perfil,
      });
    } catch (error) {
      console.error("Erro ao finalizar o cadastro", error);
    } finally {
      setEnviando(false);
    }
  };

  const abrirLogin = () => {
    if (onLogin) onLogin();
    else Alert.alert("Login", "Aqui abriria a tela de login.");
  };

  const ultimaEtapa = etapaAtual === ETAPAS.length - 1;
  const ocupado = verificando || enviando;

  return (
    <SafeAreaView style={styles.fundo}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF4E6" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.cabecalho}>
            <Text style={styles.logo}>🐾 AdotaPet</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.titulo}>Cadastrar nova conta</Text>

            <View style={styles.progresso}>
              {ETAPAS.map((etapa, indice) => (
                <View key={etapa.titulo} style={styles.progressoItemLinha}>
                  <View style={styles.progressoEtapa}>
                    <View
                      style={[
                        styles.progressoBolha,
                        indice < etapaAtual && styles.progressoBolhaConcluida,
                        indice === etapaAtual && styles.progressoBolhaAtual,
                      ]}
                    >
                      <Text
                        style={[
                          styles.progressoBolhaTexto,
                          indice <= etapaAtual && styles.progressoBolhaTextoAtivo,
                        ]}
                      >
                        {indice < etapaAtual ? "✓" : indice + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.progressoLabel,
                        indice === etapaAtual && styles.progressoLabelAtual,
                      ]}
                      numberOfLines={1}
                    >
                      {etapa.titulo}
                    </Text>
                  </View>
                  {indice < ETAPAS.length - 1 && (
                    <View
                      style={[
                        styles.progressoLinha,
                        indice < etapaAtual && styles.progressoLinhaConcluida,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            {etapaAtual === 0 && (
              <>
                <Campo rotulo="Coloque seu nome de exibição:">
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu nome"
                    placeholderTextColor="#9A8F85"
                    value={nome}
                    onChangeText={setNome}
                    autoComplete="name"
                    textContentType="name"
                  />
                </Campo>

                <Campo rotulo="Insira seu email:">
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu email"
                    placeholderTextColor="#9A8F85"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </Campo>

                <Campo rotulo="Digite sua senha:">
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9A8F85"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                  />
                </Campo>

                <Campo rotulo="Confirme sua senha:">
                  <TextInput
                    style={styles.input}
                    placeholder="Confirme a senha do campo anterior"
                    placeholderTextColor="#9A8F85"
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                  />
                </Campo>
              </>
            )}

            {etapaAtual === 1 && (
              <>
                <Campo rotulo="Digite seu CPF:">
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#9A8F85"
                    value={cpf}
                    onChangeText={setCpf}
                    keyboardType="numeric"
                    maxLength={14}
                  />
                </Campo>

                <Campo rotulo="Digite seu telefone:" erro={telErro}>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu telefone (opcional)"
                    placeholderTextColor="#9A8F85"
                    value={tel}
                    onChangeText={handleTelChange}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                </Campo>

                <Campo rotulo="Data de nascimento:" erro={idadeErro}>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#9A8F85"
                    value={dataTexto}
                    onChangeText={handleDataChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </Campo>

                <View style={styles.formGroup}>
                  <Checkbox marcado={possuiOutrosAnimais} onChange={setPossuiOutrosAnimais}>
                    Já tenho outros animais em casa
                  </Checkbox>
                </View>

                {possuiOutrosAnimais && (
                  <Campo rotulo="Quais e como é o temperamento deles? (opcional)">
                    <TextInput
                      style={[styles.input, styles.textarea]}
                      placeholder="Ex.: um cachorro de 2 anos, calmo e sociável"
                      placeholderTextColor="#9A8F85"
                      value={outrosAnimaisDescricao}
                      onChangeText={setOutrosAnimaisDescricao}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </Campo>
                )}

                <View style={styles.formGroup}>
                  <Checkbox
                    marcado={cienteCustosVeterinarios}
                    onChange={setCienteCustosVeterinarios}
                  >
                    Estou ciente de que ter um animal envolve gastos recorrentes (vacina, ração de
                    qualidade) e eventuais (imprevistos veterinários)
                  </Checkbox>
                </View>
              </>
            )}

            {etapaAtual === 2 && (
              <>
                <Campo rotulo="Tipo de residência:">
                  <Seletor
                    titulo="Tipo de residência"
                    placeholder="Selecione o tipo de residência"
                    opcoes={tiposResidencia.map((t) => ({ valor: String(t.id), rotulo: t.nome }))}
                    valor={idTipoResidencia}
                    onChange={setIdTipoResidencia}
                  />
                </Campo>

                <Campo rotulo="Tamanho da residência:">
                  <Seletor
                    titulo="Tamanho da residência"
                    placeholder="Selecione o tamanho da residência"
                    opcoes={tamanhosResidencia.map((t) => ({
                      valor: String(t.id),
                      rotulo: t.nome,
                    }))}
                    valor={idTamanhoResidencia}
                    onChange={setIdTamanhoResidencia}
                  />
                </Campo>

                <Campo rotulo="Digite seu estado:">
                  <Seletor
                    titulo="Estado"
                    placeholder="Selecione um estado"
                    opcoes={estados.map((e) => ({ valor: e.sigla, rotulo: e.nome }))}
                    valor={estado}
                    onChange={handleEstadoChange}
                    buscavel
                  />
                </Campo>

                <Campo rotulo="Digite seu município:">
                  <Seletor
                    titulo="Município"
                    placeholder={
                      !estado
                        ? "Selecione um estado primeiro"
                        : carregandoMunicipios
                        ? "Carregando municípios..."
                        : "Selecione um município"
                    }
                    opcoes={municipios.map((m) => ({ valor: m.nome, rotulo: m.nome }))}
                    valor={municipio}
                    onChange={setMunicipio}
                    desabilitado={!estado || carregandoMunicipios}
                    buscavel
                  />
                </Campo>
              </>
            )}

            {message !== "" && (
              <Text style={[styles.message, isError ? styles.messageError : styles.messageSuccess]}>
                {message}
              </Text>
            )}

            <View style={styles.navegacaoEtapas}>
              {etapaAtual > 0 && (
                <Pressable
                  onPress={voltarEtapa}
                  disabled={ocupado}
                  style={({ pressed }) => [
                    styles.botaoVoltar,
                    pressed && styles.pressionado,
                    ocupado && styles.botaoDesabilitadoSuave,
                  ]}
                >
                  <Text style={styles.botaoVoltarTexto}>Voltar</Text>
                </Pressable>
              )}

              <Pressable
                onPress={ultimaEtapa ? concluirCadastro : irParaProximaEtapa}
                disabled={ocupado}
                style={({ pressed }) => [
                  styles.botaoContinuar,
                  ocupado && styles.botaoDesabilitado,
                  pressed && styles.pressionado,
                ]}
              >
                {ocupado ? (
                  <View style={styles.botaoLinha}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.botaoContinuarTexto}>
                      {enviando ? "Enviando..." : "Verificando..."}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.botaoContinuarTexto}>
                    {ultimaEtapa ? "Concluir cadastro" : "Continuar"}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.loginLinha}>
              <Text style={styles.loginTexto}>Já possui uma conta? </Text>
              <Pressable onPress={abrirLogin} hitSlop={8}>
                <Text style={styles.link}>Faça login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}