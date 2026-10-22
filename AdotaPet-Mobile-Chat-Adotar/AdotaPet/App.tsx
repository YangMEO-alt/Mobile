import { useState } from "react";
import Login from "./src/pages/login/index";
import Cadastro from "./src/pages/cadastro/cadastro";
import Home from "./src/pages/home/home";
import Chat from "./src/pages/chat/chat";
import type { ContatoAdocao } from "./src/pages/home/home";

type Tela = "login" | "cadastro" | "home" | "chat";

export default function App() {
  const [tela, setTela] = useState<Tela>("login");
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [contatoAdocao, setContatoAdocao] = useState<ContatoAdocao | null>(null);

  const irParaHome = () => {
    setUsuarioLogado(true);
    setTela("home");
  };

  if (tela === "cadastro") {
  return (
    <Cadastro
      onCadastroConcluido={irParaHome}
      onLogin={() => setTela("login")}
    />
  );
}

  if (tela === "home") {
    return <Home usuarioLogado={usuarioLogado} onAbrirChat={() => { setContatoAdocao(null); setTela("chat"); }} onAdotar={(contato) => { setContatoAdocao(contato); setTela("chat"); }} />;
  }

  if (tela === "chat") {
    return <Chat initialContact={contatoAdocao} onVoltar={() => { setContatoAdocao(null); setTela("home"); }} />;
  }

  return (
    <Login
      onLoginSucesso={irParaHome}
      onCadastro={() => setTela("cadastro")}
    />
  );
}