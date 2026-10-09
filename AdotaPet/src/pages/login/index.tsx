import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../lib/api";
import { styles } from "../../styles/style.login";

const LIMITE_MS = 30000;

type UsuarioMe = {
  idUsuario: number;
  nome: string;
  foto: string | null;
  perfil: string;
};

export type UsuarioLogado = {
  id: number;
  firebaseUid: string;
  nome: string;
  foto: string | null;
  perfil: string;
};

export type PerfilFirestore = {
  displayName: string;
  photoURL: string | null;
  email: string;
};

type Props = {
  entrar: (email: string, senha: string) => Promise<{ uid: string }>;
  onLoginSucesso: (usuario: UsuarioLogado) => void | Promise<void>;
  sincronizarPerfil?: (uid: string, perfil: PerfilFirestore) => Promise<void>;
  onEsqueciSenha?: () => void;
  onCadastro?: () => void;
};

function comTimeout<T>(promise: Promise<T>, ms: number, rotulo: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const limite = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`TIMEOUT: ${rotulo} não respondeu em ${ms / 1000}s`)),
      ms
    );
  });

  return Promise.race([promise, limite]).finally(() => clearTimeout(timer));
}

function mensagemErroFirebase(code?: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email ou senha inválidos.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Aguarde um pouco antes de tentar de novo.";
    case "auth/user-disabled":
      return "Esta conta foi suspensa.";
    default:
      return null;
  }
}

export default function LoginScreen({
  entrar,
  onLoginSucesso,
  sincronizarPerfil,
  onEsqueciSenha,
  onCadastro,
}: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const senhaRef = useRef<TextInput>(null);

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !senha) {
      showMessage("Preencha o email e a senha.", true);
      return;
    }

    setLoading(true);
    setMessage("");

    let usuario: UsuarioLogado;

    try {
      const emailLimpo = email.trim();

      const conta = await comTimeout(entrar(emailLimpo, senha), LIMITE_MS, "Firebase Authentication");

      const dados = (await comTimeout(
        api<UsuarioMe>("/usuario/me"),
        LIMITE_MS,
        "Servidor (Spring Boot)"
      )) as UsuarioMe;

      if (sincronizarPerfil) {
        await comTimeout(
          sincronizarPerfil(conta.uid, {
            displayName: dados.nome,
            photoURL: dados.foto || null,
            email: emailLimpo,
          }),
          LIMITE_MS,
          "Firestore"
        );
      }

      usuario = {
        id: dados.idUsuario,
        firebaseUid: conta.uid,
        nome: dados.nome,
        foto: dados.foto,
        perfil: dados.perfil,
      };
    } catch (error) {
      console.error(error);
      const code = (error as { code?: string }).code;
      const mensagemFirebase = mensagemErroFirebase(code);

      showMessage(
        error instanceof Error && error.message.startsWith("TIMEOUT:")
          ? `${error.message}. Verifique sua conexão e tente novamente.`
          : mensagemFirebase || "Erro ao conectar com o servidor.",
        true
      );
      setLoading(false);
      return;
    }

    showMessage("Login realizado com sucesso!");

    try {
      await onLoginSucesso(usuario);
    } catch (error) {
      console.error("Erro ao finalizar o login", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirEsqueciSenha = () => {
    if (onEsqueciSenha) onEsqueciSenha();
    else Alert.alert("Esqueci minha senha", "Aqui abriria a tela de recuperação de senha.");
  };

  const abrirCadastro = () => {
    if (onCadastro) onCadastro();
    else Alert.alert("Cadastro", "Aqui abriria a tela de cadastro.");
  };

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
            <Text style={styles.subtitulo}>Uma adoção, duas vidas transformadas.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.titulo}>Fazer Login</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email:</Text>
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
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => senhaRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha:</Text>
              <TextInput
                ref={senhaRef}
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#9A8F85"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable onPress={abrirEsqueciSenha} hitSlop={8} style={styles.linkArea}>
              <Text style={styles.link}>Esqueci minha senha</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.botao,
                loading && styles.botaoDesabilitado,
                pressed && styles.botaoPressionado,
              ]}
            >
              {loading ? (
                <View style={styles.botaoLinha}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.botaoTexto}>Entrando...</Text>
                </View>
              ) : (
                <Text style={styles.botaoTexto}>Entrar</Text>
              )}
            </Pressable>

            {message !== "" && (
              <Text style={[styles.message, isError ? styles.messageError : styles.messageSuccess]}>
                {message}
              </Text>
            )}

            <View style={styles.cadastroLinha}>
              <Text style={styles.cadastroTexto}>Não possui uma conta? </Text>
              <Pressable onPress={abrirCadastro} hitSlop={8}>
                <Text style={styles.link}>Cadastre-se</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.privacidade}>
            🔒 Seus dados estão protegidos e nunca são compartilhados.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}