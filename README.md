# Casa & Forma — móveis industriais

O projeto usa **React + TypeScript + Vite** no `font-end` e Spring Boot/Java no `Back-end`. O build Vite publica o site em `Back-end/src/main/resources/static`, de onde o Spring serve a loja e a API pela mesma origem HTTPS. O backend usa PostgreSQL, Flyway, Spring Data JPA, Lombok, MapStruct, Bean Validation e Spring Security com tokens JWT.

## Executar no Windows, sem Docker

Pré-requisitos: Node.js 22.22+ (ou 26), Java 25 e PostgreSQL instalado.

1. Abra `services.msc` e inicie o serviço PostgreSQL que você já configurou. O `.env` do backend deve apontar para o mesmo banco local (`DB_PORTA`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`). Não compartilhe esse arquivo nem cole senhas em mensagens.

2. O certificado HTTPS local já fica em `Back-end/secrets/localhost.p12`. Se precisar recriá-lo, na pasta `usereuser` execute:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Back-end\scripts\generate-local-cert.ps1
   ```

3. Confirme que `Back-end/.env` tem os campos `STORE_MERCHANT_NAME`, `STORE_MERCHANT_EMAIL`, `STORE_MERCHANT_CPF` e `STORE_MERCHANT_PASSWORD`. A senha precisa ter pelo menos 12 caracteres. O Spring cria a conta do lojista no banco na primeira inicialização. Não há rota de cadastro de lojista no front-end.

   Se a conta já existir e você precisar trocar a senha, coloque também `STORE_MERCHANT_RESET_PASSWORD=true`, reinicie o Spring uma vez e depois altere essa variável para `false`. Isso atualiza somente a conta de lojista cujo e-mail está configurado no mesmo `.env`.

4. Inicie o Spring na IntelliJ ou pelo PowerShell, a partir da pasta `usereuser`:

   ```powershell
   Set-Location .\Back-end
   .\gradlew.bat bootRun
   ```

   O `bootRun` usa a raiz `usereuser` para importar `Back-end/.env` e localizar o certificado. O servidor fica em `https://localhost:8443`.

5. Abra `https://localhost:8443/api/health` no navegador e aceite o aviso do certificado autoassinado local. Depois abra `https://localhost:8443` para ver a loja servida pelo Spring.

6. Para desenvolvimento React com atualização automática, em outra janela:

   ```powershell
   Set-Location .\font-end
   $env:Path = "C:\Program Files\nodejs;" + $env:Path
   & "C:\Program Files\nodejs\npm.cmd" install
   & "C:\Program Files\nodejs\npm.cmd" start
   ```

   O Vite/React usa `https://localhost:8443/api` durante o desenvolvimento. Se o Node estiver instalado em outro local, ajuste o caminho de `nodejs`.

## Compilar React para o Spring

Depois de alterar o front-end, na pasta `font-end` execute:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
& "C:\Program Files\nodejs\npm.cmd" run build
```

O comando gera o React diretamente em `Back-end/src/main/resources/static`. Em seguida, inicie/reinicie o Spring e abra `https://localhost:8443`. Não é necessário rodar o servidor de desenvolvimento Vite para usar o build incorporado.

## Catálogo de demonstração e compras

O banco pode começar sem produtos. Para permitir testar o checkout, `Back-end/.env` agora tem `APP_DEMO_DATA_ENABLED=true`; na inicialização o backend insere três móveis identificados como demonstração, mas só quando a tabela de produtos está vazia. Desative essa opção no ambiente de produção. A vitrine React sempre lê `GET /api/products` e não usa IDs falsos como `p1`; catálogo vazio mostra uma mensagem e não oferece compra de um produto inexistente.

Somente clientes autenticados podem concluir compras. O formulário reaproveita nome, e-mail e telefone da conta, e o backend associa o pedido ao cliente identificado pelo JWT. O lojista configura a previsão de entrega por pedido no painel; a data aparece na conta do cliente. A conta do cliente e o painel do lojista atualizam pedidos e status automaticamente a cada 10 segundos enquanto estiverem abertos. Os pedidos exigem produto real ativo no banco. Uma chave `Idempotency-Key` evita criar cópias do mesmo pedido em reenvios.

O lojista pode cadastrar opções de cor do ferro, cor e tipo da madeira e cor do estofado em cada produto. O cliente escolhe as opções disponíveis; elas são validadas pelo backend e salvas junto ao pedido.

Clientes podem excluir a própria conta autenticada. O backend desativa o acesso e anonimiza os dados pessoais também nos pedidos, preservando apenas os registros sem identificação pessoal.

## CEP, frete e pagamentos

O backend consulta CEPs na API pública do ViaCEP (`https://viacep.com.br/ws/{CEP}/json/`) e mantém uma cache local limitada a 1.000 consultas por 24 horas. A cidade de São Paulo e as demais cidades do estado têm valores fixos independentes, sem valores padrão definidos; configure-os em `Back-end/.env` por `SHIPPING_SAO_PAULO_CAPITAL_PRICE` e `SHIPPING_SAO_PAULO_STATE_PRICE`. Quando houver um preço configurado, o backend recalcula o frete no envio do pedido e o soma ao total; destinos fora de SP são encaminhados para contato manual de frete e prazo. A API oficial do ViaCEP recomenda enviar exatamente oito dígitos, informa CEPs inexistentes no campo `erro` e alerta contra validação massiva de bases.

A tela e a interface `ItauPaymentGateway` estão preparadas no front-end. A cobrança on-line ainda não está ativa; antes de habilitá-la, será necessário integrar as credenciais e o contrato da API de pagamentos do Itaú no backend. Nenhum dado de cartão é coletado por esta versão.

## Fotos e conta do lojista

O lojista escolhe arquivos de imagem no painel. O React envia o arquivo para `POST /api/admin/products/images`; o backend grava JPG, PNG, WEBP ou GIF de até 10 MB em `uploads/products` e armazena a URL no cadastro. A API usa a interface `ProductImageStorage`, com implementação local para desenvolvimento; ela pode ser substituída por um adaptador para hospedagem de imagens quando o serviço estiver escolhido. Faça backup dessa pasta. Não coloque arquivo de senha nem credencial de lojista no front-end.

O e-mail, CPF, nome e senha iniciais do lojista são configurados somente em `Back-end/.env`. O backend armazena a senha com hash; a interface contém apenas a tela de login. Clientes podem se cadastrar no front-end React.

## API principal

| Método | Rota | Acesso |
| --- | --- | --- |
| `GET` | `/api/products` | Público; produtos ativos |
| `GET` | `/api/banners` | Público; destaques atuais |
| `POST` | `/api/shipping/quote` | Público; consulta CEP e classifica frete por cidade/estado |
| `POST` | `/api/auth/register` | Cadastro de cliente |
| `POST` | `/api/auth/login` | Login de cliente; retorna JWT |
| `GET` | `/api/account/profile` | Cliente autenticado |
| `GET` | `/api/account/orders` | Pedidos vinculados à conta autenticada |
| `DELETE` | `/api/account` | Cliente autenticado; desativa conta e anonimiza dados pessoais |
| `POST` | `/api/orders` | Cliente autenticado; envia `Idempotency-Key` |
| `POST` | `/api/admin/auth/login` | Login de lojista pré-configurado, com e-mail, senha e CPF |
| `GET/POST` | `/api/admin/products` | Lojista autenticado |
| `PUT/DELETE` | `/api/admin/products/{id}` | Lojista autenticado |
| `POST` | `/api/admin/products/images` | Upload protegido de imagem pelo lojista |
| `PATCH` | `/api/admin/orders/{id}/delivery-date` | Lojista autenticado; define ou remove a previsão de entrega |

O valor de frete paulista permanece sem configuração até que a loja defina os valores no backend. A integração de pagamentos Itaú ainda não foi habilitada.
