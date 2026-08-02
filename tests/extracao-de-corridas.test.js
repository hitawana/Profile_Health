import assert from "node:assert/strict";
import test from "node:test";

import {
  COLUNAS_DA_PLANILHA_DE_CORRIDAS,
  ErroDeExtracaoDeCorridas,
  extrairCorridasDasLinhasDaPlanilha,
  extrairCorridasDoPreenchimentoManual,
} from "../js/extracao-de-corridas.js";

function criarLinhasDaPlanilha(...corridas) {
  return [
    ["Registro de Corridas"],
    ["Instruções"],
    COLUNAS_DA_PLANILHA_DE_CORRIDAS,
    [],
    ["2020-01-01", "Exemplo ignorado", 1, 0, 1, 0],
    ...corridas,
  ];
}

test("extrai dados a partir da linha 6 e calcula o Ritmo exato", () => {
  const corridasExtraidas = extrairCorridasDasLinhasDaPlanilha(
    criarLinhasDaPlanilha(
      ["2026-07-01", "Corrida do Parque", 5, 0, 25, 0],
      ["2026-07-15", "", 10, 0, 52, 30],
    ),
  );

  assert.equal(corridasExtraidas.length, 2);
  assert.deepEqual(corridasExtraidas[0], {
    dataDaCorrida: "2026-07-01",
    nomeDaCorrida: "Corrida do Parque",
    distanciaDaCorridaKm: 5,
    tempoHoras: 0,
    tempoMinutos: 25,
    tempoSegundos: 0,
    tempoTotalEmSegundos: 1500,
    ritmoPaceEmSegundosPorKm: 300,
  });
  assert.equal(corridasExtraidas[1].nomeDaCorrida, "");
  assert.equal(corridasExtraidas[1].ritmoPaceEmSegundosPorKm, 315);
});

test("ignora a linha 5 reservada ao exemplo", () => {
  const corridasExtraidas = extrairCorridasDasLinhasDaPlanilha(
    criarLinhasDaPlanilha(["2026-08-01", "Corrida válida", 5, 0, 24, 0]),
  );

  assert.equal(corridasExtraidas.length, 1);
  assert.equal(corridasExtraidas[0].nomeDaCorrida, "Corrida válida");
});

test("interrompe a extração quando uma coluna obrigatória falha", () => {
  assert.throws(
    () =>
      extrairCorridasDasLinhasDaPlanilha(
        criarLinhasDaPlanilha(["2026-08-01", "Sem distância", "", 0, 24, 0]),
      ),
    (erro) =>
      erro instanceof ErroDeExtracaoDeCorridas &&
      /Linha 6/.test(erro.message) &&
      /Distância/.test(erro.message),
  );

  assert.throws(
    () =>
      extrairCorridasDasLinhasDaPlanilha(
        criarLinhasDaPlanilha(["2026-08-01", "Tempo inválido", 5, 0, 60, 0]),
      ),
    /Tempo \(Minutos\).*0 e 59/,
  );
});

test("interrompe a extração quando o cabeçalho diverge do template", () => {
  const linhas = criarLinhasDaPlanilha([
    "2026-08-01",
    "Corrida válida",
    5,
    0,
    24,
    0,
  ]);
  linhas[2] = [...COLUNAS_DA_PLANILHA_DE_CORRIDAS];
  linhas[2][2] = "Distância";

  assert.throws(
    () => extrairCorridasDasLinhasDaPlanilha(linhas),
    /coluna C.*Distância \(km\)/,
  );
});

test("converte o preenchimento manual para a mesma estrutura", () => {
  const corridasExtraidas = extrairCorridasDoPreenchimentoManual([
    ["2026-08-01", "Manual", "7.5", "0", "40", "30"],
  ]);

  assert.equal(corridasExtraidas.length, 1);
  assert.equal(corridasExtraidas[0].distanciaDaCorridaKm, 7.5);
  assert.equal(corridasExtraidas[0].tempoTotalEmSegundos, 2430);
  assert.equal(corridasExtraidas[0].ritmoPaceEmSegundosPorKm, 324);
});
