# Front-end Casa & Forma — React

O front-end usa React, TypeScript e Vite. A loja obtém os produtos pelo backend e não inventa produtos de fallback quando o banco está vazio.

## Desenvolvimento

Requer Node.js 22.22+ (ou 26). Inicie o Spring e o PostgreSQL primeiro; o React de desenvolvimento consome `https://localhost:8443/api`.

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" start
```

## Build integrado ao Spring

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```

O Vite publica os arquivos compilados em `../Back-end/src/main/resources/static` e configura `/api` como caminho da API no build de produção. Depois abra `https://localhost:8443` com o Spring ativo.

## Configuração local

- API de desenvolvimento: `VITE_API_BASE_URL` e `VITE_API_ORIGIN` (padrão `https://localhost:8443/api`).
- API no build integrado: `/api`, servida pela mesma origem.
- WhatsApp: configure `VITE_WHATSAPP_NUMBER` em um arquivo `.env`. Use país e DDD, somente dígitos.
- Credenciais do lojista: somente `Back-end/.env`; nunca colocar senha ou CPF em variáveis `VITE_` ou no frontend.
- Pagamento: `ItauPaymentGateway` define o contrato para uma futura integração. A página informa que pagamentos on-line ainda não estão habilitados e não solicita dados de cartão.

As imagens de produtos são carregadas como arquivos para o endpoint protegido do backend. O storage local pode ser substituído por uma implementação de provedor de imagens sem mudar o formato do catálogo no React.
