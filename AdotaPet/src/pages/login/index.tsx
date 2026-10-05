import { SetStateAction, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import styles from "../../styles/style.login";

function comTimeout(promise: Promise<void>, ms: number, rotulo: string) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`TIMEOUT: ${rotulo} não respondeu em ${ms / 1000}s`)),
        ms
      )
    ),
  ]);
}

type FirebaseError = Error & {
  code?: string;
};

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

async function loginSimulado(email: string, senha: string) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (senha !== "123456") {
    const erro = new Error("Credenciais inválidas") as FirebaseError;
    erro.code = "auth/invalid-credential";
    throw erro;
  }
}

type LoginScreenProps = {
  onLogin?: (email: string, senha: string) => Promise<void>;
  onLoginSucesso?: () => void;
  onEsqueciSenha?: () => void;
  onCadastro?: () => void;
};

export default function LoginScreen({
  onLogin = loginSimulado,
  onLoginSucesso,
  onEsqueciSenha,
  onCadastro,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const showMessage = (text: SetStateAction<string>, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleLogin = async () => {
    if (!email.trim() || !senha) {
      showMessage("Preencha o email e a senha.", true);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await comTimeout(onLogin(email.trim(), senha), 30000, "Servidor");
      showMessage("Login realizado com sucesso!");
      if (onLoginSucesso) onLoginSucesso();
    } catch (error) {
      console.error(error);
      const erro = error instanceof Error ? error : new Error(String(error));
      const codigoErro =
        typeof error === "object" && error !== null && "code" in error
          ? typeof error.code === "string"
            ? error.code
            : undefined
          : undefined;
      const mensagemFirebase = mensagemErroFirebase(codigoErro);
      showMessage(
        erro.message.startsWith("TIMEOUT:")
          ? `${erro.message}. Verifique sua conexão e tente novamente.`
          : mensagemFirebase || "Erro ao conectar com o servidor.",
        true
      );
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
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
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha:</Text>
              <TextInput
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
                onSubmitEditing={handleLogin}
                returnKeyType="go"
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