# 🐞 Correção do Bug de Data de Pagamento Incorreta

## Diagnóstico

O problema relatado estava relacionado à exibição de **datas de pagamento incorretas** na aplicação. Para entender a origem do bug, segui três etapas principais:

1. **Verificação na base de dados**: Analisei os dados salvos e percebi que algumas datas de pagamento estavam desalinhadas com o esperado.
2. **Análise do Backend**: No schema de `Payment`, o campo `paymentDate` tinha `default: Date.now`, o que em teoria deveria salvar a data atual. O campo `month`, embora requerido, poderia aceitar formatos inválidos caso não fosse validado corretamente.
3. **Análise do resolver GraphQL** (`resolver.ts`): Foi identificado que ao criar um pagamento, não havia validação explícita no `month`, e o `paymentDate` podia não ser controlado se passado manualmente.

## Solução Implementada

No resolver responsável pela criação e atualização dos pagamentos (`createPayment` e `updatePayment`):

- Adicionei uma **validação com Regex** para garantir que o campo `month` esteja no formato `YYYY-MM`.

```ts
if (!monthRegex.test(month)) {
    throw new Error('Invalid month format. Expected YYYY-MM.');
}
```

- No campo `paymentDate`, substituí o valor padrão por uma atribuição direta com `new Date()` dentro do resolver, garantindo que **sempre** será usada a data atual no momento da criação:

```ts
paymentDate: new Date(),
```

- No método de **atualização de pagamentos**, adicionei uma lógica para impedir a alteração do `paymentDate`, tornando-o **imutável após a criação**.

### 🧪 Validação com Script de Teste

Para garantir que as correções implementadas funcionam corretamente em diferentes cenários, criei testes personalizados no ficheiro `src/test/test-example.ts`. Este script conecta-se à base de dados de teste (`condominium-test`) e simula diferentes formas de envio dos dados de pagamento, testando casos como:

- `paymentDate` omitido ou indefinido (deve assumir a data atual);
- `paymentDate` nulo (deve ser ignorado);
- `month` com formatos inválidos (como `08-2024` ou `2024/08`);
- `month` com formato válido (`YYYY-MM`).

Estes testes foram essenciais para validar que as restrições aplicadas ao `month` e ao `paymentDate` no backend estavam a funcionar corretamente, impedindo dados inválidos e garantindo integridade.

✅ Para executar o script, na raiz do projeto `estragalux`, utilize o seguinte comando:
>
> ```bash
> npx ts-node src/tests/test-example.ts
> ```

### ✅ Validação de Campos no Frontend

Além da validação no backend, implementei validações no formulário do frontend para garantir que os dados inseridos pelos utilizadores seguem o formato correto **antes mesmo de serem enviados** à API. Isso melhora a experiência do utilizador e evita chamadas desnecessárias ao backend.

As principais validações incluídas:

- O campo `month` (mês de pagamento) deve estar no formato `YYYY-MM`.
- Campos obrigatórios não podem ser deixados em branco (como o `month`).

Essas validações estão implementadas diretamente nos componentes do formulário, usando verificações simples com feedback visual (por exemplo, mensagens de erro e bordas vermelhas) ao lado do campo.

Desta forma, combinando validações no frontend e backend, assegurei maior robustez e usabilidade da aplicação.

### 🔍 Considerações sobre Datas no Frontend

Durante os testes, verifiquei que os campos `createdAt` e `updatedAt` são fornecidos diretamente pela base de dados, através do schema Mongoose com `timestamps: true`. 

Como esses campos não dependem do input do utilizador, não foi necessário implementar validações no frontend.



## Resultado

Essas mudanças asseguram que:

- Apenas meses no formato correto são aceitos.
- A data de pagamento reflete corretamente a data da criação do registo.
- A data de pagamento não pode ser manipulada posteriormente.

<br>
<hr>
<br>

## 🏢 Implementação da Funcionalidade: Filtro por Prédio

De acordo com o enunciado do desafio, foi solicitado implementar um **filtro por prédio** na página de listagem de apartamentos (Apartment Owners).

### 🛠️ O que foi feito:

- Adicionei um campo de filtro suspenso (dropdown) com todos os prédios disponíveis, consumidos a partir da query `GET_BUILDINGS`.
- Ao selecionar um prédio, a listagem de moradores é atualizada automaticamente, exibindo apenas os que pertencem ao prédio selecionado.
- A filtragem foi realizada diretamente no frontend, utilizando o campo `building.name` associado a cada morador.

### 📁 Ficheiros alterados:

- `ApartmentOwners.tsx`: 
- Adicionado o `useQuery(GET_BUILDINGS)` para obter os prédios;
- Criado o estado `selectedBuilding` para armazenar o filtro;
- Implementado o filtro diretamente no `map()` que renderiza os cartões dos moradores.

### 💡 Resultado:

Agora é possível selecionar um prédio específico e visualizar apenas os moradores associados a ele, proporcionando uma navegação mais clara e organizada.

