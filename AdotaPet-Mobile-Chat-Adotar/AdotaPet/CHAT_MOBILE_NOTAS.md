# Chat mobile — AdotaPet

Esta versão adapta o fluxo principal do Chat web para React Native + TypeScript + Expo:

- lista as conversas existentes em `GET /chat/conversas`;
- abre o histórico em `GET /chat/conversas/{id}/mensagens`;
- envia mensagens de texto em `POST /chat/conversas/{id}/mensagens` com `clientMsgId` idempotente;
- marca conversas como lidas;
- recebe eventos em tempo real pelo WebSocket STOMP `/ws` e `/user/queue/eventos`;
- mostra bloqueio, mensagens apagadas/moderadas, indicador de não lidas e confirmação de leitura quando o backend fornece esses dados;
- adiciona acesso ao Chat pela tela inicial após login.

## Dependência

Foi adicionada `@stomp/stompjs` ao `package.json`. Dentro da pasta do projeto, execute `npm install` e depois `npx expo start`.

## Observações importantes

- A implementação mobile cobre o fluxo principal de texto e sincronização em tempo real. Anexos, áudio, player de mídia, propostas de adoção interativas, denúncia e exclusão de mensagem ainda precisam de adaptação específica para componentes nativos.
- O backend web deve estar disponível e aceitar WebSocket no endpoint `/ws`; o token de acesso é enviado no cabeçalho STOMP `CONNECT`.
- A tela lista conversas já existentes. A criação de uma nova conversa a partir do botão Adotar ainda depende de integrar o contato selecionado com `POST /chat/conversas`.
- Não incluí arquivos `.env` nem a pasta `.git` no ZIP de entrega.
