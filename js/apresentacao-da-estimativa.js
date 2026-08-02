import {
  FORMULA_DE_EVOLUCAO_RECENTE,
  FORMULA_DE_PROJECAO_COM_FADIGA,
  GATILHO_DE_CONSTANCIA,
  GATILHO_DE_MUDANCA_DE_ESFORCO,
} from "./estimativa-de-ritmo.js";

const formatadorDaVariacaoDaDistancia = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
  style: "percent",
});

function apresentarComparacaoComHistorico({
  distanciaDaMetaKm,
  distanciaMediaHistoricaKm,
} = {}) {
  if (
    !Number.isFinite(distanciaDaMetaKm) ||
    !Number.isFinite(distanciaMediaHistoricaKm) ||
    distanciaMediaHistoricaKm <= 0
  ) {
    return "Comparação indisponível";
  }

  const diferencaDaDistanciaKm =
    distanciaDaMetaKm - distanciaMediaHistoricaKm;

  if (diferencaDaDistanciaKm === 0) {
    return "Essa corrida tem a mesma distância da sua média";
  }

  const variacaoDaDistancia =
    Math.abs(diferencaDaDistanciaKm) / distanciaMediaHistoricaKm;
  const direcaoDaDistancia =
    diferencaDaDistanciaKm > 0 ? "longa" : "curta";

  return `Essa corrida é ${formatadorDaVariacaoDaDistancia.format(
    variacaoDaDistancia,
  )} mais ${direcaoDaDistancia} que sua média`;
}

function apresentarAjusteDaNovaDistancia({
  distanciaDaMetaKm,
  distanciaMediaHistoricaKm,
} = {}) {
  return distanciaDaMetaKm >= distanciaMediaHistoricaKm
    ? "Corridas mais longas costumam ter um ritmo um pouco mais lento — já ajustamos sua estimativa pra isso"
    : "Corridas mais curtas costumam permitir um ritmo um pouco mais rápido — já ajustamos sua estimativa pra isso";
}

const APRESENTACOES_DOS_GATILHOS = new Map([
  [
    GATILHO_DE_CONSTANCIA,
    Object.freeze({
      detalheTecnico: GATILHO_DE_CONSTANCIA,
    }),
  ],
  [
    GATILHO_DE_MUDANCA_DE_ESFORCO,
    Object.freeze({
      detalheTecnico: GATILHO_DE_MUDANCA_DE_ESFORCO,
    }),
  ],
]);

const APRESENTACOES_DAS_FORMULAS = new Map([
  [
    FORMULA_DE_EVOLUCAO_RECENTE,
    Object.freeze({
      detalheTecnico: "Média Móvel Ponderada (WMA)",
      mensagem: "Baseado no seu ritmo mais recente",
    }),
  ],
  [
    FORMULA_DE_PROJECAO_COM_FADIGA,
    Object.freeze({
      detalheTecnico: "Equação de Riegel",
      apresentarMensagem: apresentarAjusteDaNovaDistancia,
    }),
  ],
]);

function obterApresentacao(
  mapaDeApresentacoes,
  termoTecnico,
  contextoDaEstimativa,
) {
  const apresentacao = mapaDeApresentacoes.get(termoTecnico);

  if (!apresentacao) {
    return Object.freeze({
      detalheTecnico: "",
      mensagem: termoTecnico,
    });
  }

  return Object.freeze({
    detalheTecnico: apresentacao.detalheTecnico,
    mensagem: apresentacao.apresentarMensagem
      ? apresentacao.apresentarMensagem(contextoDaEstimativa)
      : apresentacao.mensagem,
  });
}

export function apresentarGatilhoDaEstimativa(
  gatilhoAcionado,
  contextoDaEstimativa,
) {
  const apresentacao = obterApresentacao(
    APRESENTACOES_DOS_GATILHOS,
    gatilhoAcionado,
    contextoDaEstimativa,
  );

  return Object.freeze({
    ...apresentacao,
    mensagem: apresentarComparacaoComHistorico(contextoDaEstimativa),
  });
}

export function apresentarFormulaDaEstimativa(
  formulaAplicada,
  contextoDaEstimativa,
) {
  return obterApresentacao(
    APRESENTACOES_DAS_FORMULAS,
    formulaAplicada,
    contextoDaEstimativa,
  );
}
