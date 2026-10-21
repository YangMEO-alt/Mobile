import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {styles} from "../../styles/style.chat";

type Mensagem = {
  id: string;
  texto: string;
  minha: boolean;
};

// Mensagens de exemplo, só pra ver como a tela fica.
// Depois a gente troca isso pelas mensagens que vêm do backend.
const MENSAGENS_INICIAIS: Mensagem[] = [
  { id: "1", texto: "Oi! Vi que você tem interesse em adotar o Thor 🐶", minha: false },
  { id: "2", texto: "Oi! Tenho sim, ele ainda está disponível?", minha: true },
  { id: "3", texto: "Está sim! Quer marcar uma visita?", minha: false },
];

export default function ChatScreen() {
  const [mensagens, setMensagens] = useState<Mensagem[]>(MENSAGENS_INICIAIS);
  const [texto, setTexto] = useState("");
  const listaRef = useRef<FlatList<Mensagem>>(null);

  function enviar() {
    const limpo = texto.trim();
    if (!limpo) return;

    setMensagens((atual) => [
      ...atual,
      { id: String(Date.now()), texto: limpo, minha: true },
    ]);
    setTexto("");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Chat</Text>
      </View>

      <FlatList
        ref={listaRef}
        data={mensagens}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              styles.balao,
              item.minha ? styles.balaoMinha : styles.balaoOutro,
            ]}
          >
            <Text style={item.minha ? styles.textoMinha : styles.textoOutro}>
              {item.texto}
            </Text>
          </View>
        )}
      />

      <View style={styles.barraEnvio}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite uma mensagem"
          onSubmitEditing={enviar}
          returnKeyType="send"
        />
        <Pressable style={styles.botao} onPress={enviar}>
          <Text style={styles.botaoTexto}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}