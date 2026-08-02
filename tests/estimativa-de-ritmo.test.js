import assert from "node:assert/strict";
import test from "node:test";

import {
  CONSTANTE_DE_FADIGA_PARA_ATLETAS_AMADORES,
  FORMULA_DE_EVOLUCAO_RECENTE,
  FORMULA_DE_PROJECAO_COM_FADIGA,
  GATILHO_DE_CONSTANCIA,
  GATILHO_DE_MUDANCA_DE_ESFORCO,
  MARGEM_DE_TOLERANCIA_PADRAO,
  calcularDistanciaMediaHistorica,
  calcularFormulaDeEvolucaoRecenteWMA,
  calcularFormulaDeProjecaoComFadigaRiegel,
  calcularRitmoProjetado,
  identificarGatilhoDeDecisao,
} from "../js/estimativa-de-ritmo.js";

const corridasExtraidas = Object.freeze([
  Object.freeze({
    dataDaCorrida: "2026-01-01",
    distanciaDaCorridaKm: 5,
    ritmoPaceEmSegundosPorKm: 300,
    tempoTotalEmSegundos: 1500,
  }),
  Object.freeze({
    dataDaCorrida: "2026-02-01",
    distanciaDaCorridaKm: 5,
    ritmoPaceEmSegundosPorKm: 280,
    tempoTotalEmSegundos: 1400,
  }),
  Object.freeze({
    dataDaCorrida: "2026-03-01",
    distanciaDaCorridaKm: 5,
    ritmoPaceEmSegundosPorKm: 260,
    tempoTotalEmSegundos: 1300,
  }),
]);

test("calcula a Distância Média Histórica", () => {
  assert.equal(calcularDistanciaMediaHistorica(corridasExtraidas), 5);
});

test("aplica a Margem de Tolerância padrão de 15% nos limites inclusivos", () => {
  assert.equal(MARGEM_DE_TOLERANCIA_PADRAO, 0.15);
  assert.equal(
    identificarGatilhoDeDecisao({
      distanciaDaMetaKm: 4.25,
      distanciaMediaHistoricaKm: 5,
    }),
    GATILHO_DE_CONSTANCIA,
  );
  assert.equal(
    identificarGatilhoDeDecisao({
      distanciaDaMetaKm: 5.75,
      distanciaMediaHistoricaKm: 5,
    }),
    GATILHO_DE_CONSTANCIA,
  );
  assert.equal(
    identificarGatilhoDeDecisao({
      distanciaDaMetaKm: 5.76,
      distanciaMediaHistoricaKm: 5,
    }),
    GATILHO_DE_MUDANCA_DE_ESFORCO,
  );
});

test("calcula a Fórmula de Evolução Recente com pesos lineares crescentes", () => {
  const ritmoProjetado =
    calcularFormulaDeEvolucaoRecenteWMA(corridasExtraidas);
  const wmaEsperada = (300 * 1 + 280 * 2 + 260 * 3) / (1 + 2 + 3);

  assert.equal(ritmoProjetado, wmaEsperada);
});

test("calcula a Fórmula de Projeção com Fadiga pela Equação de Riegel", () => {
  const tempoProjetado = calcularFormulaDeProjecaoComFadigaRiegel({
    distanciaDaMetaKm: 10,
    distanciaMediaHistoricaKm: 5,
    tempoMedioHistoricoEmSegundos: 1400,
  });
  const tempoEsperado = 1400 * (10 / 5) ** 1.06;

  assert.equal(CONSTANTE_DE_FADIGA_PARA_ATLETAS_AMADORES, 1.06);
  assert.equal(tempoProjetado, tempoEsperado);
});

test("roteia Meta dentro da Margem de Tolerância para WMA", () => {
  const estimativa = calcularRitmoProjetado({
    corridasExtraidas,
    distanciaDaMetaKm: 5,
  });

  assert.equal(estimativa.gatilhoAcionado, GATILHO_DE_CONSTANCIA);
  assert.equal(estimativa.formulaAplicada, FORMULA_DE_EVOLUCAO_RECENTE);
  assert.equal(
    estimativa.ritmoProjetadoEmSegundosPorKm,
    (300 * 1 + 280 * 2 + 260 * 3) / 6,
  );
});

test("roteia mudança de esforço para Riegel e calcula o Ritmo Projetado", () => {
  const estimativa = calcularRitmoProjetado({
    corridasExtraidas,
    distanciaDaMetaKm: 10,
  });
  const tempoProjetadoEsperado = 1400 * (10 / 5) ** 1.06;

  assert.equal(
    estimativa.gatilhoAcionado,
    GATILHO_DE_MUDANCA_DE_ESFORCO,
  );
  assert.equal(estimativa.formulaAplicada, FORMULA_DE_PROJECAO_COM_FADIGA);
  assert.equal(estimativa.tempoTotalEstimadoEmSegundos, tempoProjetadoEsperado);
  assert.equal(
    estimativa.ritmoProjetadoEmSegundosPorKm,
    tempoProjetadoEsperado / 10,
  );
});
