import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { api, ErroHttp } from "../../lib/api";
import { styles } from "../../styles/style.cadastro"

const IDADE_MINIMA = 18;
const SENHA_MIN_LENGTH = 8;

const ETAPAS = [{ titulo: "Sua conta" }, { titulo: "Seus dados" }, { titulo: "Onde você mora" }];

type ItemLookup = { id: number; nome: string };
type EnderecoCep = {
  estado?: string;
  municipio?: string;
  bairro?: string;
  logradouro?: string;
};
type RespostaRegistro = Record<string, unknown>;
type Opcao = { valor: string; rotulo: string };

type RequisitosSenha = {
  requisitoTamanho: boolean;
  requisitoMaiuscula: boolean;
  requisitoMinuscula: boolean;
  requisitoNumero: boolean;
  requisitoEspecial: boolean;
  requisitoSoAscii: boolean;
};

type Props = {
  onCadastroConcluido: (resposta: RespostaRegistro) => void | Promise<void>;
  onLogin?: () => void;
};

const ITENS_SENHA: { chave: keyof RequisitosSenha; texto: string }[] = [
  { chave: "requisitoTamanho", texto: `Mínimo de ${SENHA_MIN_LENGTH} caracteres` },
  { chave: "requisitoMaiuscula", texto: "Uma letra maiúscula" },
  { chave: "requisitoMinuscula", texto: "Uma letra minúscula" },
  { chave: "requisitoNumero", texto: "Um número" },
  { chave: "requisitoEspecial", texto: "Um caractere especial (ex.: !@#$%)" },
  { chave: "requisitoSoAscii", texto: "Sem emojis ou acentos" },
];

const DOMINIOS_COMUNS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.com.br",
  "outlook.com",
  "outlook.com.br",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "uol.com.br",
  "bol.com.br",
];

function cpfValido(cpfDigitado: string) {
  const cpf = cpfDigitado.replace(/\D/g, "");
  if (cpf.length !== 11 || new Set(cpf).size === 1) return false;

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

function checarRequisitosSenha(senha: string): RequisitosSenha {
  return {
    requisitoTamanho: senha.length >= SENHA_MIN_LENGTH,
    requisitoMaiuscula: /[A-Z]/.test(senha),
    requisitoMinuscula: /[a-z]/.test(senha),
    requisitoNumero: /\d/.test(senha),
    requisitoEspecial: /[!-/:-@[-`{-~]/.test(senha),
    requisitoSoAscii: /^[\x20-\x7E]*$/.test(senha),
  };
}

function validarForcaSenha(senha: string) {
  const r = checarRequisitosSenha(senha);
  if (!r.requisitoSoAscii) return "A senha não pode ter emojis ou acentos.";
  if (!r.requisitoTamanho) return `A senha precisa ter pelo menos ${SENHA_MIN_LENGTH} caracteres.`;
  if (!r.requisitoMaiuscula) return "A senha precisa ter uma letra maiúscula.";
  if (!r.requisitoMinuscula) return "A senha precisa ter uma letra minúscula.";
  if (!r.requisitoNumero) return "A senha precisa ter um número.";
  if (!r.requisitoEspecial) return "A senha precisa ter um caractere especial (ex.: !@#$%).";
  return null;
}

function distancia(a: string, b: string) {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);

  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = linha[j];
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        anterior + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      anterior = guardado;
    }
  }

  return linha[b.length];
}

function sugerirCorrecaoEmail(email: string) {
  const texto = email.trim().toLowerCase();
  const arroba = texto.lastIndexOf("@");
  if (arroba < 1) return null;

  const usuario = texto.slice(0, arroba);
  const dominio = texto.slice(arroba + 1);
  if (dominio.length < 5 || DOMINIOS_COMUNS.includes(dominio)) return null;

  let melhor: string | null = null;
  let melhorDistancia = Infinity;

  for (const candidato of DOMINIOS_COMUNS) {
    const d = distancia(dominio, candidato);
    const limite = candidato.length >= 10 ? 2 : 1;
    if (d <= limite && d < melhorDistancia) {
      melhor = candidato;
      melhorDistancia = d;
    }
  }

  return melhor ? `${usuario}@${melhor}` : null;
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

function extrairMensagemErro(error: unknown, fallback = "Erro ao conectar com o servidor.") {
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
  }

  if (error instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  return fallback;
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

function RequisitoSenha({ atendido, children }: { atendido: boolean; children: ReactNode }) {
  return (
    <View style={styles.requisitoLinha}>
      <Text style={[styles.requisitoMarca, atendido ? styles.requisitoOk : styles.requisitoPendente]}>
        {atendido ? "✓" : "○"}
      </Text>
      <Text style={[styles.requisitoTexto, atendido ? styles.requisitoOk : styles.requisitoPendente]}>
        {children}
      </Text>
    </View>
  );
}

function Seletor({
  titulo,
  placeholder,
  opcoes,
  valor,
  onChange,
}: {
  titulo: string;
  placeholder: string;
  opcoes: Opcao[];
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const selecionada = opcoes.find((opcao) => opcao.valor === valor);

  return (
    <>
      <Pressable onPress={() => setAberto(true)} style={styles.seletor} accessibilityRole="button">
        <Text
          style={[styles.seletorTexto, !selecionada && styles.seletorPlaceholder]}
          numberOfLines={1}
        >
          {selecionada ? selecionada.rotulo : placeholder}
        </Text>
        <Text style={styles.seletorSeta}>▾</Text>
      </Pressable>

      <Modal visible={aberto} animationType="slide" onRequestClose={() => setAberto(false)}>
        <SafeAreaView style={styles.modalFundo}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>{titulo}</Text>
            <Pressable onPress={() => setAberto(false)} hitSlop={10} accessibilityLabel="Fechar">
              <Text style={styles.modalFechar}>×</Text>
            </Pressable>
          </View>

          <FlatList
            data={opcoes}
            keyExtractor={(opcao) => opcao.valor}
            ListEmptyComponent={<Text style={styles.modalVazio}>Nenhuma opção encontrada.</Text>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.valor);
                  setAberto(false);
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

export default function CadastroScreen({ onCadastroConcluido, onLogin }: Props) {
  const [etapaAtual, setEtapaAtual] = useState(0);

  const [cep, setCep] = useState("");
  const [cepErro, setCepErro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enderecoResolvido, setEnderecoResolvido] = useState<EnderecoCep | null>(null);
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [bairro, setBairro] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const cepRequisicao = useRef(0);

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

  const requisitosSenha = useMemo(() => checarRequisitosSenha(senha), [senha]);
  const sugestaoEmail = useMemo(() => sugerirCorrecaoEmail(email), [email]);

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error)
  };

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

  const handleCepChange = async (texto: string) => {
    const digitado = texto.replace(/\D/g, "").slice(0, 8);

    cepRequisicao.current += 1;
    const minhaRequisicao = cepRequisicao.current;

    setCep(digitado);
    setCepErro("");
    setEnderecoResolvido(null);
    setEstado("");
    setMunicipio("");
    setBairro("");
    setLogradouro("");

    if (digitado.length !== 8) {
      setBuscandoCep(false);
      return;
    }

    setBuscandoCep(true);

    try {
      const data = await api<EnderecoCep>(`/endereco/cep/${digitado}`);
      if (minhaRequisicao !== cepRequisicao.current) return;

      setEnderecoResolvido(data);
      setEstado(data.estado ?? "");
      setMunicipio(data.municipio ?? "");
      setBairro(data.bairro ?? "");
      setLogradouro(data.logradouro ?? "");
    } catch (error) {
      if (minhaRequisicao !== cepRequisicao.current) return;

      setEnderecoResolvido(null);
      setCepErro(extrairMensagemErro(error, "Não foi possível confirmar este CEP."));
    } finally {
      if (minhaRequisicao === cepRequisicao.current) setBuscandoCep(false);
    }
  };

  const validarEtapa = (indice: number): string | null => {
    if (indice === 0) {
      if (!nome.trim()) return "Digite seu nome.";
      if (!email.trim()) return "Digite seu email.";
      if (!emailValido(email)) return "E-mail inválido.";
      if (!senha) return "Digite uma senha.";
      const erroSenha = validarForcaSenha(senha);
      if (erroSenha) return erroSenha;
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
    if (cep.length !== 8) return "Digite um CEP válido.";
    if (!enderecoResolvido) return "Aguarde a confirmação do CEP antes de continuar.";
    if (!estado.trim() || !municipio.trim()) return "Preencha estado e município.";
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
    const erroSenhaSubmit = validarForcaSenha(senha);
    if (erroSenhaSubmit) {
      showMessage(erroSenhaSubmit, true);
      setEtapaAtual(0);
      return;
    }

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

    let resposta: RespostaRegistro;
    try {
      resposta = await api<RespostaRegistro>("/auth/register", {
        method: "POST",
        body: {
          nome: nome.trim(),
          email: email.trim(),
          senha,
          cpf,
          telefone: tel,
          cep,
          estadoCorrigido: estado,
          municipioCorrigido: municipio,
          bairroCorrigido: bairro,
          logradouroCorrigido: logradouro,
          foto: null,
          dataDeNascimento: data.iso,
          idTipoResidencia: Number(idTipoResidencia),
          idTamanhoResidencia: Number(idTamanhoResidencia),
          possuiOutrosAnimais,
          outrosAnimaisDescricao: possuiOutrosAnimais ? outrosAnimaisDescricao : null,
          cienteCustosVeterinarios,
        },
      });
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof ErroHttp
          ? extrairMensagemErro(error, "Não foi possível criar sua conta agora. Tente novamente.")
          : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        true
      );
      setEnviando(false);
      return;
    }

    showMessage("Cadastro realizado com sucesso!");

    try {
      await onCadastroConcluido(resposta);
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

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Insira seu email:</Text>
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
                  {!!sugestaoEmail && (
                    <Text style={styles.sugestaoEmail}>
                      Você quis dizer?{" "}
                      <Text
                        style={styles.sugestaoEmailBotao}
                        onPress={() => setEmail(sugestaoEmail)}
                      >
                        {sugestaoEmail}
                      </Text>
                    </Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Digite sua senha:</Text>
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
                  {senha.length > 0 && (
                    <View style={styles.checklistSenha}>
                      {ITENS_SENHA.map((item) => (
                        <RequisitoSenha key={item.chave} atendido={requisitosSenha[item.chave]}>
                          {item.texto}
                        </RequisitoSenha>
                      ))}
                    </View>
                  )}
                </View>

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

                <View style={styles.formGroup}>
                  <Text style={styles.label}>CEP:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite seu CEP"
                    placeholderTextColor="#9A8F85"
                    value={cep}
                    onChangeText={handleCepChange}
                    keyboardType="numeric"
                    maxLength={8}
                  />
                  {buscandoCep && <Text style={styles.infoCampo}>Buscando endereço...</Text>}
                  {!!cepErro && <Text style={styles.erroCampo}>{cepErro}</Text>}
                </View>

                {enderecoResolvido && (
                  <>
                    <Campo rotulo="Estado:">
                      <TextInput
                        style={styles.input}
                        placeholder="UF"
                        placeholderTextColor="#9A8F85"
                        value={estado}
                        onChangeText={(texto) => setEstado(texto.toUpperCase())}
                        maxLength={2}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </Campo>

                    <Campo rotulo="Município:">
                      <TextInput
                        style={styles.input}
                        placeholder="Digite seu município"
                        placeholderTextColor="#9A8F85"
                        value={municipio}
                        onChangeText={setMunicipio}
                      />
                    </Campo>

                    <Campo rotulo="Bairro:">
                      <TextInput
                        style={styles.input}
                        placeholder="Digite seu bairro"
                        placeholderTextColor="#9A8F85"
                        value={bairro}
                        onChangeText={setBairro}
                      />
                    </Campo>

                    <Campo rotulo="Logradouro:">
                      <TextInput
                        style={styles.input}
                        placeholder="Rua, avenida..."
                        placeholderTextColor="#9A8F85"
                        value={logradouro}
                        onChangeText={setLogradouro}
                      />
                    </Campo>
                  </>
                )}
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
