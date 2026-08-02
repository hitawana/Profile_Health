import assert from "node:assert/strict";
import test from "node:test";

import {
  apresentarFormulaDaEstimativa,
  apresentarGatilhoDaEstimativa,
} from "../js/apresentacao-da-estimativa.js";
import {
  FORMULA_DE_EVOLUCAO_RECENTE,
  FORMULA_DE_PROJECAO_COM_FADIGA,
  GATILHO_DE_CONSTANCIA,
  GATILHO_DE_MUDANCA_DE_ESFORCO,
} from "../js/estimativa-de-ritmo.js";

test("mostra quanto a Meta é mais longa sem perder o detalhe técnico", () => {
  assert.deepEqual(
    apresentarGatilhoDaEstimativa(GATILHO_DE_MUDANCA_DE_ESFORCO, {
      distanciaDaMetaKm: 10,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: GATILHO_DE_MUDANCA_DE_ESFORCO,
      mensagem: "Essa corrida é 100% mais longa que sua média",
    },
  );
});

test("mostra quanto a Meta é mais curta", () => {
  assert.deepEqual(
    apresentarGatilhoDaEstimativa(GATILHO_DE_MUDANCA_DE_ESFORCO, {
      distanciaDaMetaKm: 4,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: GATILHO_DE_MUDANCA_DE_ESFORCO,
      mensagem: "Essa corrida é 20% mais curta que sua média",
    },
  );
});

test("descreve uma Meta com a mesma distância de forma específica", () => {
  assert.deepEqual(
    apresentarGatilhoDaEstimativa(GATILHO_DE_CONSTANCIA, {
      distanciaDaMetaKm: 5,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: GATILHO_DE_CONSTANCIA,
      mensagem: "Essa corrida tem a mesma distância da sua média",
    },
  );
});

test("humaniza as fórmulas WMA e Riegel", () => {
  assert.deepEqual(
    apresentarFormulaDaEstimativa(FORMULA_DE_EVOLUCAO_RECENTE, {
      distanciaDaMetaKm: 5,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: "Média Móvel Ponderada (WMA)",
      mensagem: "Baseado no seu ritmo mais recente",
    },
  );
  assert.deepEqual(
    apresentarFormulaDaEstimativa(FORMULA_DE_PROJECAO_COM_FADIGA, {
      distanciaDaMetaKm: 10,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: "Equação de Riegel",
      mensagem:
        "Corridas mais longas costumam ter um ritmo um pouco mais lento — já ajustamos sua estimativa pra isso",
    },
  );
});

test("explica o ajuste de fadiga quando a Meta é mais curta", () => {
  assert.deepEqual(
    apresentarFormulaDaEstimativa(FORMULA_DE_PROJECAO_COM_FADIGA, {
      distanciaDaMetaKm: 4,
      distanciaMediaHistoricaKm: 5,
    }),
    {
      detalheTecnico: "Equação de Riegel",
      mensagem:
        "Corridas mais curtas costumam permitir um ritmo um pouco mais rápido — já ajustamos sua estimativa pra isso",
    },
  );
});
