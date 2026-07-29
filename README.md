# Profile Analytics — Health

SPA client-side para atletas amadores acompanharem dados de corrida sem conta,
backend ou persistência permanente.

## Funcionalidades disponíveis

TK-01 — Boas-vindas e Entrada de Dados:

- nome ou apelido;
- foto de perfil;
- upload da planilha de tempos `.xlsx`;
- alternativa de preenchimento manual preparada para o futuro template;
- validação inicial dos arquivos;
- feedback de erro e processamento.

## Execução

O projeto não possui build ou dependências instaladas. Sirva a pasta raiz com
um servidor HTTP estático e abra `index.html`.

Exemplo:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

## Testes

```powershell
node --test
```

## Arquitetura

- HTML, CSS e JavaScript nativos.
- Processamento local no navegador.
- Sem conta, backend ou banco de dados.
- `Base/` permanece somente leitura e fora do versionamento.

