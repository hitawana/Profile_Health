import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPOS_DA_PLANILHA_DE_TEMPOS,
  validarValorDaColuna,
} from "../js/campos-da-planilha-de-tempos.js";

const camposPorNome = new Map(
  CAMPOS_DA_PLANILHA_DE_TEMPOS.map((campo) => [campo.nome, campo]),
);

test("espelha as seis colunas do template na ordem original", () => {
  assert.deepEqual(
    CAMPOS_DA_PLANILHA_DE_TEMPOS.map(({ coluna, nome }) => ({ coluna, nome })),
    [
      { coluna: "A", nome: "Data da Corrida" },
      { coluna: "B", nome: "Nome da Corrida (Opcional)" },
      { coluna: "C", nome: "Distância (km)" },
      { coluna: "D", nome: "Tempo (Horas)" },
      { coluna: "E", nome: "Tempo (Minutos)" },
      { coluna: "F", nome: "Tempo (Segundos)" },
    ],
  );
});

test("mantém somente Nome da Corrida como campo opcional", () => {
  assert.deepEqual(
    CAMPOS_DA_PLANILHA_DE_TEMPOS.filter(({ obrigatorio }) => !obrigatorio).map(
      ({ nome }) => nome,
    ),
    ["Nome da Corrida (Opcional)"],
  );
});

test("valida Data da Corrida conforme o intervalo do template", () => {
  const campo = camposPorNome.get("Data da Corrida");

  assert.equal(validarValorDaColuna(campo, "2026-08-01"), "");
  assert.match(validarValorDaColuna(campo, ""), /Preencha/);
  assert.match(validarValorDaColuna(campo, "2026-02-30"), /válida/);
  assert.match(validarValorDaColuna(campo, "1999-12-31"), /2000/);
  assert.match(validarValorDaColuna(campo, "2100-01-01"), /2099/);
});

test("aceita Distância decimal positiva", () => {
  const campo = camposPorNome.get("Distância (km)");

  assert.equal(validarValorDaColuna(campo, "21.1"), "");
  assert.match(validarValorDaColuna(campo, "0"), /maior que 0/);
  assert.match(validarValorDaColuna(campo, "-1"), /maior que 0/);
  assert.match(validarValorDaColuna(campo, "distância"), /número válido/);
});

test("exige horas inteiras e não negativas", () => {
  const campo = camposPorNome.get("Tempo (Horas)");

  assert.equal(validarValorDaColuna(campo, "0"), "");
  assert.equal(validarValorDaColuna(campo, "12"), "");
  assert.match(validarValorDaColuna(campo, "1.5"), /inteiro/);
  assert.match(validarValorDaColuna(campo, "-1"), /mínimo 0/);
});

test("limita minutos e segundos a inteiros entre 0 e 59", () => {
  for (const nome of ["Tempo (Minutos)", "Tempo (Segundos)"]) {
    const campo = camposPorNome.get(nome);

    assert.equal(validarValorDaColuna(campo, "0"), "");
    assert.equal(validarValorDaColuna(campo, "59"), "");
    assert.match(validarValorDaColuna(campo, "1.5"), /inteiro/);
    assert.match(validarValorDaColuna(campo, "60"), /máximo 59/);
  }
});
