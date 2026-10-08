import axios from "axios";
 
export const API_URL = "http://localhost:3001";
 
const CHAVE_DICA = "adotapet_sessao";
const CHAVE_PERFIL_CACHE = "usuario"; // mesma chave usada pelo AuthContext
const CABECALHO_ANTI_CSRF = { "X-Requested-With": "XMLHttpRequest" };
const MARGEM_RENOVACAO_MS = 30_000;
 
export const MENSAGEM_CONTA_SUSPENSA = "Esta conta foi suspensa.";


// Estado da sessão mantido em memória

let accessToken = null;
let accessTokenExpiraEm = 0; // epoch ms, relógio local

export function temAccessToken() {
    return accessToken != null;
}

export function obterAccessToken() {
    return accessToken;
}

/** Devolve um access token válido, renovando só se faltar menos de 30 s para vencer. */
export async function garantirAccessToken() {
    if (!accessToken || accessTokenExpiraEm - Date.now() < MARGEM_RENOVACAO_MS) {
        await renovarSessao();
    }
    return accessToken;
}
 
function lerDica() {
    try {
        return localStorage.getItem(CHAVE_DICA) === "1";
    } catch {
        return false;
    }
}
 
function gravarDica(valor) {
    try {
        if (valor) localStorage.setItem(CHAVE_DICA, "1");
        else localStorage.removeItem(CHAVE_DICA);
    } catch {
        // Storage bloqueado (modo privado restrito): segue sem a dica.
    }
}
 
export function temDicaDeSessao() {
    return lerDica();
}
 
/** Guarda o access token devolvido por login/registro/refresh/troca de senha. */
export function aplicarSessao(sessao) {
    accessToken = sessao.accessToken;
    accessTokenExpiraEm = Date.now() + (sessao.expiraEmSegundos ?? 600) * 1000;
    gravarDica(true);
}
 
/** Esquece a sessão LOCAL (não avisa o servidor -- ver encerrarSessaoNoServidor). */
export function limparSessaoLocal() {
    accessToken = null;
    accessTokenExpiraEm = 0;
    gravarDica(false);
    try {
        localStorage.removeItem(CHAVE_PERFIL_CACHE);
    } catch {
        // ignora
    }
}
 
 
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
 
// Cliente sem interceptadores, sem os interceptors abaixo: a renovação não pode disparar outra renovação.
const clienteAuth = axios.create({
    baseURL: API_URL,
    timeout: 20_000,
    withCredentials: true,
    headers: CABECALHO_ANTI_CSRF,
});
 
let renovacaoEmAndamento = null;
 
async function executarRenovacao() {
    const TENTATIVAS = 3;
    for (let tentativa = 1; ; tentativa++) {
        try {
            const { data } = await clienteAuth.post("/auth/refresh");
            aplicarSessao(data);
            return data;
        } catch (err) {
            const codigo = err.response?.data?.codigo;
            if (codigo === "SESSAO_EM_RENOVACAO" && tentativa < TENTATIVAS) {
                await esperar(400);
                continue;
            }
            throw err;
        }
    }
}
 
/** Troca o refresh token (cookie) por uma sessão nova. */
export function renovarSessao() {
    if (!renovacaoEmAndamento) {
        renovacaoEmAndamento = executarRenovacao().finally(() => {
            renovacaoEmAndamento = null;
        });
    }
    return renovacaoEmAndamento;
}
 
// Inicialização: o AuthContext chama esta função uma vez.
let bootEmAndamento = null;
 
export function restaurarSessao() {
    if (!bootEmAndamento) {
        bootEmAndamento = renovarSessao().finally(() => {
            bootEmAndamento = null;
        });
    }
    return bootEmAndamento;
}
 
/** Avisa o servidor para revogar o refresh token e apagar o cookie. */
export async function encerrarSessaoNoServidor() {
    try {
        await clienteAuth.post("/auth/logout", null, { timeout: 5_000 });
    } catch (err) {
        // Sem rede / servidor fora: o logout local já vale; o refresh token vence sozinho em até 14 dias.
        console.warn("Não foi possível avisar o servidor do logout", err);
    }
}
 
 
// timeout: 20000 -- sem isso, o padrão do axios é SEM limite de tempo.
const api = axios.create({
    baseURL: API_URL,
    timeout: 20_000,
    withCredentials: true,
    headers: CABECALHO_ANTI_CSRF,
});
 
api.interceptors.request.use(async (config) => {
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
            // segue com o token antigo; se já venceu, o 401 abaixo trata.
        }
    }
 
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});
 
let encerrandoSessao = false;
 
function tratarSessaoEncerrada(motivo) {
    // Evita disparar o fluxo várias vezes se várias chamadas em paralelo receberem o mesmo erro quase ao mesmo tempo.
    if (encerrandoSessao) return;
    encerrandoSessao = true;
 
    limparSessaoLocal();
 
    // window.location para limpar o estado da tela: este arquivo não é um componente React, e um reload completo garante que qualquer.
    const rotulo = motivo === "banimento" ? "conta-suspensa" : "sessao-invalida";
    window.location.href = `/?motivo=${rotulo}`;
}
 
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const resposta = error.response;
        const config = error.config;
        if (!resposta || !config) return Promise.reject(error);
 
        const corpo = resposta.data;
        const codigo = corpo && typeof corpo === "object" ? corpo.codigo : undefined;
        const mensagem = typeof corpo === "string" ? corpo : corpo?.message;
 
        // Conta banida enquanto a sessão estava aberta.
        if (resposta.status === 403 && (codigo === "CONTA_SUSPENSA" || mensagem === MENSAGEM_CONTA_SUSPENSA)) {
            tratarSessaoEncerrada("banimento");
            // Não rejeita: o redirect já está em curso e o componente chamador não tem o que fazer com esse erro.
            return new Promise(() => {});
        }
 
        // Usuário do token não existe mais (ex.: banco resetado em dev).
        if (resposta.status === 401 && codigo === "SESSAO_INVALIDA" && config.url !== "/auth/login") {
            tratarSessaoEncerrada("sessao-invalida");
            return new Promise(() => {});
        }
 
        // Access token ausente/vencido/revogado: renova e repete uma vez.
        const tokenRuim = resposta.status === 401 && (codigo === "TOKEN_INVALIDO" || codigo === "TOKEN_AUSENTE");
        if (tokenRuim && !config._jaRenovou && (accessToken || lerDica())) {
            config._jaRenovou = true;
            try {
                await renovarSessao();
            } catch (erroRenovacao) {
                const codigoRenovacao = erroRenovacao.response?.data?.codigo;
                if (erroRenovacao.response?.status === 403 && codigoRenovacao === "CONTA_SUSPENSA") {
                    tratarSessaoEncerrada("banimento");
                    return new Promise(() => {});
                }
                if (erroRenovacao.response) {
                    // O servidor recusou a renovação: a sessão acabou.
                    limparSessaoLocal();
                    window.dispatchEvent(new CustomEvent("sessao-encerrada"));
                }
                // Sem resposta = rede fora: mantém a dica para tentar depois.
                return Promise.reject(error);
            }
            config.headers.Authorization = `Bearer ${accessToken}`;
            return api.request(config);
        }
 
        return Promise.reject(error);
    }
);
 
export default api;
 
 