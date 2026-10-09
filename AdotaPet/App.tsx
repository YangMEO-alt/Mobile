import { useState } from "react";
import Login from "./src/pages/login/index";
import Cadastro from "./src/pages/cadastro/cadastro";
import Home from "./src/pages/home/home";

type Tela = "login" | "cadastro" | "home";

export default function App() {
  const [tela, setTela] = useState<Tela>("login");
  const [usuarioLogado, setUsuarioLogado] = useState(false);

  const irParaHome = () => {
    setUsuarioLogado(true);
    setTela("home");
  };

  if (tela === "cadastro") {
    return (
      <Cadastro
        criarConta={async () => ({ uid: "teste", desfazer: async () => {} })}
        onCadastroConcluido={irParaHome}
        onLogin={() => setTela("login")}
      />
    );
  }

  if (tela === "home") {
    return <Home usuarioLogado={usuarioLogado} />;
  }

  return (
    <Login
      entrar={async () => ({ uid: "teste" })}
      onLoginSucesso={irParaHome}
      onCadastro={() => setTela("cadastro")}
    />
  );
}