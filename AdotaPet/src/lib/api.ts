export const API_URL = "adotapet-production.up.railway.app";

export const MENSAGEM_CONTA_SUSPENSA = "Esta conta foi suspensa.";

const CABECALHO_ANTI_CSRF = { "X-Requested-With": "XMLHttpRequest" };
const MARGEM_RENOVACAO_MS = 30000;
const LIMITE_MS = 20000;
const ROTAS_SEM_SESSAO = ["/auth/login", "/auth/register"];

export type Sessao = {
  accessToken: string;
  expiraEmSegundos?: number;
  [chave: string]: unknown;
};

export type MotivoEncerramento = "banimento" | "sessao-invalida" | "expirada";

type ValorParam = string | number | boolean | null | undefined;

type Params = Record<string, ValorParam | ValorParam[]>;

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Params;
  body?: unknown;
  signal?: AbortSignal;
};

type RespostaCrua = {
  ok: boolean;
  status: number;
  dados: unknown;
};

export class ErroHttp extends Error {
  status: number;
  dados: unknown;

  constructor(status: number, mensagem: string, dados: unknown = null) {
    super(mensagem);
    this.name = "ErroHttp";
    this.status = status;
    this.dados = dados;
  }
}

let accessToken: string | null = null;
let accessTokenExpiraEm = 0;
let sessaoPossivel = false;
let encerrandoSessao = false;
let renovacaoEmAndamento: Promise<Sessao> | null = null;
let bootEmAndamento: Promise<Sessao> | null = null;

const ouvintes = new Set<(motivo: MotivoEncerramento) => void>();

export function aoEncerrarSessao(fn: (motivo: MotivoEncerramento) => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

function notificar(motivo: MotivoEncerramento) {
  ouvintes.forEach((fn) => fn(motivo));
}

export function temAccessToken() {
  return accessToken != null;
}

export function obterAccessToken() {
  return accessToken;
}

export async function garantirAccessToken() {
  if (!accessToken || accessTokenExpiraEm - Date.now() < MARGEM_RENOVACAO_MS) {
    await renovarSessao();
  }
  return accessToken;
}

export function aplicarSessao(sessao: Sessao) {
  accessToken = sessao.accessToken;
  accessTokenExpiraEm = Date.now() + (sessao.expiraEmSegundos ?? 600) * 1000;
  sessaoPossivel = true;
  encerrandoSessao = false;
}

export function limparSessaoLocal() {
  accessToken = null;
  accessTokenExpiraEm = 0;
  sessaoPossivel = false;
}

function tratarSessaoEncerrada(motivo: MotivoEncerramento) {
  if (encerrandoSessao) return;
  encerrandoSessao = true;
  limparSessaoLocal();
  notificar(motivo);
}

function ehSessao(dados: unknown): dados is Sessao {
  return (
    typeof dados === "object" &&
    dados !== null &&
    typeof (dados as { accessToken?: unknown }).accessToken === "string"
  );
}

function lerCampo(dados: unknown, campo: string) {
  if (dados && typeof dados === "object") {
    const valor = (dados as Record<string, unknown>)[campo];
    if (typeof valor === "string") return valor;
  }
  return undefined;
}

function montarQuery(params: Params) {
  const partes: string[] = [];

  Object.entries(params).forEach(([chave, valor]) => {
    const itens = Array.isArray(valor) ? valor : [valor];
    itens.forEach((item) => {
      if (item === null || item === undefined || item === "") return;
      partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(item))}`);
    });
  });

  return partes.length > 0 ? `?${partes.join("&")}` : "";
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function requisitarCru(
  caminho: string,
  {
    method = "GET",
    headers = {},
    body,
    signal,
  }: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  } = {}
): Promise<RespostaCrua> {
  const controller = new AbortController();
  let estourou = false;

  const timer = setTimeout(() => {
    estourou = true;
    controller.abort();
  }, LIMITE_MS);

  const aoAbortar = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", aoAbortar);
  }

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body,
      signal: controller.signal,
      credentials: "include",
    });

    const texto = await resposta.text();
    let dados: unknown = null;
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = texto;
      }
    }

    return { ok: resposta.ok, status: resposta.status, dados };
  } catch (erro) {
    if (estourou) {
      throw new Error(`TIMEOUT: Servidor não respondeu em ${LIMITE_MS / 1000}s`);
    }
    throw erro;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", aoAbortar);
  }
}

async function executarRenovacao(): Promise<Sessao> {
  const TENTATIVAS = 3;

  for (let tentativa = 1; ; tentativa++) {
    const r = await requisitarCru("/auth/refresh", {
      method: "POST",
      headers: { Accept: "application/json", ...CABECALHO_ANTI_CSRF },
    });

    if (r.ok && ehSessao(r.dados)) {
      aplicarSessao(r.dados);
      return r.dados;
    }

    if (lerCampo(r.dados, "codigo") === "SESSAO_EM_RENOVACAO" && tentativa < TENTATIVAS) {
      await esperar(400);
      continue;
    }

    throw new ErroHttp(r.status, `HTTP ${r.status} em /auth/refresh`, r.dados);
  }
}

export function renovarSessao() {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = executarRenovacao().finally(() => {
      renovacaoEmAndamento = null;
    });
  }
  return renovacaoEmAndamento;
}

export function restaurarSessao() {
  if (!bootEmAndamento) {
    bootEmAndamento = renovarSessao().finally(() => {
      bootEmAndamento = null;
    });
  }
  return bootEmAndamento;
}

export async function encerrarSessaoNoServidor() {
  try {
    await requisitarCru("/auth/logout", {
      method: "POST",
      headers: { Accept: "application/json", ...CABECALHO_ANTI_CSRF },
    });
  } catch (err) {
    console.warn("Não foi possível avisar o servidor do logout", err);
  }
}

export async function sair() {
  await encerrarSessaoNoServidor();
  limparSessaoLocal();
}

async function executar<T>(caminho: string, opcoes: Opcoes, jaRenovou: boolean): Promise<T> {
  if (bootEmAndamento) {
    try {
      await bootEmAndamento;
    } catch {
      // sem sessão: segue como visitante
    }
  } else if (accessToken && accessTokenExpiraEm - Date.now() < MARGEM_RENOVACAO_MS) {
    try {
      await renovarSessao();
    } catch {
      // segue com o token antigo
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...CABECALHO_ANTI_CSRF,
  };

  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const r = await requisitarCru(`${caminho}${montarQuery(opcoes.params ?? {})}`, {
    method: opcoes.method ?? "GET",
    headers,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    signal: opcoes.signal,
  });

  if (r.ok) {
    if (ehSessao(r.dados)) aplicarSessao(r.dados);
    if (r.status === 204) return undefined as T;
    return r.dados as T;
  }

  const erro = new ErroHttp(r.status, `HTTP ${r.status} em ${caminho}`, r.dados);
  const codigo = lerCampo(r.dados, "codigo");
  const mensagem = typeof r.dados === "string" ? r.dados : lerCampo(r.dados, "message");
  const rotaSemSessao = ROTAS_SEM_SESSAO.includes(caminho);

  if (
    r.status === 403 &&
    !rotaSemSessao &&
    (codigo === "CONTA_SUSPENSA" || mensagem === MENSAGEM_CONTA_SUSPENSA)
  ) {
    tratarSessaoEncerrada("banimento");
    throw erro;
  }

  if (r.status === 401 && codigo === "SESSAO_INVALIDA" && !rotaSemSessao) {
    tratarSessaoEncerrada("sessao-invalida");
    throw erro;
  }

  const tokenRuim = r.status === 401 && (codigo === "TOKEN_INVALIDO" || codigo === "TOKEN_AUSENTE");

  if (tokenRuim && !jaRenovou && (accessToken || sessaoPossivel)) {
    try {
      await renovarSessao();
    } catch (erroRenovacao) {
      if (erroRenovacao instanceof ErroHttp) {
        if (
          erroRenovacao.status === 403 &&
          lerCampo(erroRenovacao.dados, "codigo") === "CONTA_SUSPENSA"
        ) {
          tratarSessaoEncerrada("banimento");
        } else {
          limparSessaoLocal();
          notificar("expirada");
        }
      }
      throw erro;
    }

    return executar<T>(caminho, opcoes, true);
  }

  throw erro;
}

export function api<T = unknown>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  return executar<T>(caminho, opcoes, false);
}

export function extrairMensagemErro(error: unknown, fallback = "Erro ao conectar com o servidor.") {
  if (error instanceof ErroHttp) {
    const dados = error.dados;

    if (typeof dados === "string" && dados.trim()) return dados;

    for (const chave of ["message", "mensagem", "erro", "error"]) {
      const valor = lerCampo(dados, chave);
      if (valor && valor.trim()) return valor;
    }
  }

  if (error instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }

  return fallback;
}