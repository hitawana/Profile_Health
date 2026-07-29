import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";

import {
  LIMITE_DE_ARQUIVO_EM_BYTES,
  validarFotoDePerfil,
  validarPlanilhaDeTempos,
} from "../js/validacao-de-arquivos.js";

function criarArquivo({
  nome,
  tamanho = 1,
  tipo = "application/octet-stream",
}) {
  return new File([new Uint8Array(tamanho)], nome, { type: tipo });
}

test("aceita foto de perfil com tipo de imagem e até 2 MB", () => {
  const foto = criarArquivo({
    nome: "perfil.png",
    tipo: "image/png",
    tamanho: LIMITE_DE_ARQUIVO_EM_BYTES,
  });

  assert.equal(validarFotoDePerfil(foto), "");
});

test("rejeita foto ausente, vazia, acima do limite ou sem tipo de imagem", () => {
  assert.match(validarFotoDePerfil(), /Selecione/);
  assert.match(
    validarFotoDePerfil(
      criarArquivo({ nome: "perfil.png", tipo: "image/png", tamanho: 0 }),
    ),
    /vazio/,
  );
  assert.match(
    validarFotoDePerfil(
      criarArquivo({
        nome: "perfil.png",
        tipo: "image/png",
        tamanho: LIMITE_DE_ARQUIVO_EM_BYTES + 1,
      }),
    ),
    /2 MB/,
  );
  assert.match(
    validarFotoDePerfil(
      criarArquivo({ nome: "perfil.txt", tipo: "text/plain" }),
    ),
    /imagem/,
  );
});

test("aceita planilha de tempos .xlsx com até 2 MB", () => {
  const planilha = criarArquivo({
    nome: "tempos.XLSX",
    tamanho: LIMITE_DE_ARQUIVO_EM_BYTES,
  });

  assert.equal(validarPlanilhaDeTempos(planilha), "");
});

test("rejeita planilha ausente, vazia, acima do limite ou fora de .xlsx", () => {
  assert.match(validarPlanilhaDeTempos(), /Selecione/);
  assert.match(
    validarPlanilhaDeTempos(
      criarArquivo({ nome: "tempos.xlsx", tamanho: 0 }),
    ),
    /vazio/,
  );
  assert.match(
    validarPlanilhaDeTempos(
      criarArquivo({
        nome: "tempos.xlsx",
        tamanho: LIMITE_DE_ARQUIVO_EM_BYTES + 1,
      }),
    ),
    /2 MB/,
  );
  assert.match(
    validarPlanilhaDeTempos(criarArquivo({ nome: "tempos.csv" })),
    /\.xlsx/,
  );
});

