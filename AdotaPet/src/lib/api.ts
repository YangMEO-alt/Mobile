export const API_URL = "http://192.168.15.29:3001";

type ObterToken = () => Promise<string | null | undefined>;

type ValorParam = string | number | boolean | null | undefined;

type Params = Record<string, ValorParam | ValorParam[]>;

type Opcoes = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Params;
  body?: unknown;
  signal?: AbortSignal;
};

let obterTokenAtual: ObterToken | null = null;

export function definirObtentorDeToken(fn: ObterToken | null) {
  obterTokenAtual = fn;
}

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

export async function api<T = unknown>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (opcoes.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (obterTokenAtual) {
    const token = await obterTokenAtual();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}${montarQuery(opcoes.params ?? {})}`, {
    method: opcoes.method ?? "GET",
    headers,
    body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    signal: opcoes.signal,
  });

  if (!resposta.ok) {
    let dados: unknown = null;
    const texto = await resposta.text().catch(() => "");
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = texto;
      }
    }
    throw new ErroHttp(resposta.status, `HTTP ${resposta.status} em ${caminho}`, dados);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  return resposta.json() as Promise<T>;
}