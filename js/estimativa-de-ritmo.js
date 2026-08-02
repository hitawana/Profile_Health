import { ordenarCorridasPorData } from "./historico-de-ritmo.js";

export const MARGEM_DE_TOLERANCIA_PADRAO = 0.15;
export const CONSTANTE_DE_FADIGA_PARA_ATLETAS_AMADORES = 1.06;

export const GATILHO_DE_CONSTANCIA = "Gatilho de Constância";
export const GATILHO_DE_MUDANCA_DE_ESFORCO =
  "Gatilho de Mudança de Esforço";
export const FORMULA_DE_EVOLUCAO_RECENTE =
  "Fórmula de Evolução Recente (Média Móvel Ponderada / WMA)";
export const FORMULA_DE_PROJECAO_COM_FADIGA =
  "Fórmula de Projeção com Fadiga (Equação de Riegel)";

function validarHistoricoDeCorridas(corridasExtraidas) {
  if (!Array.isArray(corridasExtraidas) || corridasExtraidas.length === 0) {
    throw new RangeError(
      "O histórico precisa ter ao menos uma corrida para calcular a estimativa.",
    );
  }
}

function calcularMedia(valores) {
  return valores.reduce((total, valor) => total + valor, 0) / valores.length;
}

export function calcularDistanciaMediaHistorica(corridasExtraidas) {
  validarHistoricoDeCorridas(corridasExtraidas);

  return calcularMedia(
    corridasExtraidas.map(({ distanciaDaCorridaKm }) => distanciaDaCorridaKm),
  );
}

export function calcularTempoMedioHistorico(corridasExtraidas) {
  validarHistoricoDeCorridas(corridasExtraidas);

  return calcularMedia(
    corridasExtraidas.map(
      ({ tempoTotalEmSegundos }) => tempoTotalEmSegundos,
    ),
  );
}

export function calcularMargemDeTolerancia({
  distanciaMediaHistoricaKm,
  margemDeTolerancia = MARGEM_DE_TOLERANCIA_PADRAO,
}) {
  if (!Number.isFinite(margemDeTolerancia) || margemDeTolerancia < 0) {
    throw new RangeError("A Margem de Tolerância deve ser maior ou igual a zero.");
  }

  return Object.freeze({
    distanciaMaximaKm:
      distanciaMediaHistoricaKm * (1 + margemDeTolerancia),
    distanciaMinimaKm:
      distanciaMediaHistoricaKm * (1 - margemDeTolerancia),
  });
}

export function identificarGatilhoDeDecisao({
  distanciaDaMetaKm,
  distanciaMediaHistoricaKm,
  margemDeTolerancia = MARGEM_DE_TOLERANCIA_PADRAO,
}) {
  const { distanciaMaximaKm, distanciaMinimaKm } =
    calcularMargemDeTolerancia({
      distanciaMediaHistoricaKm,
      margemDeTolerancia,
    });

  return distanciaDaMetaKm >= distanciaMinimaKm &&
    distanciaDaMetaKm <= distanciaMaximaKm
    ? GATILHO_DE_CONSTANCIA
    : GATILHO_DE_MUDANCA_DE_ESFORCO;
}

export function calcularFormulaDeEvolucaoRecenteWMA(corridasExtraidas) {
  validarHistoricoDeCorridas(corridasExtraidas);

  const corridasEmOrdemCronologica =
    ordenarCorridasPorData(corridasExtraidas);
  let somaDosRitmosPonderados = 0;
  let somaDosPesos = 0;

  for (const [indiceCronologico, corrida] of
    corridasEmOrdemCronologica.entries()) {
    // Pesos lineares 1…n: a corrida mais recente sempre recebe o maior peso.
    const pesoDaCorrida = indiceCronologico + 1;

    somaDosRitmosPonderados +=
      corrida.ritmoPaceEmSegundosPorKm * pesoDaCorrida;
    somaDosPesos += pesoDaCorrida;
  }

  return somaDosRitmosPonderados / somaDosPesos;
}

export function calcularFormulaDeProjecaoComFadigaRiegel({
  constanteDeFadiga = CONSTANTE_DE_FADIGA_PARA_ATLETAS_AMADORES,
  distanciaDaMetaKm,
  distanciaMediaHistoricaKm,
  tempoMedioHistoricoEmSegundos,
}) {
  return (
    tempoMedioHistoricoEmSegundos *
    (distanciaDaMetaKm / distanciaMediaHistoricaKm) ** constanteDeFadiga
  );
}

export function calcularRitmoProjetado({
  corridasExtraidas,
  distanciaDaMetaKm,
  margemDeTolerancia = MARGEM_DE_TOLERANCIA_PADRAO,
}) {
  validarHistoricoDeCorridas(corridasExtraidas);

  if (!Number.isFinite(distanciaDaMetaKm) || distanciaDaMetaKm <= 0) {
    throw new RangeError("A distância da Meta deve ser maior que zero.");
  }

  const distanciaMediaHistoricaKm =
    calcularDistanciaMediaHistorica(corridasExtraidas);
  const gatilhoAcionado = identificarGatilhoDeDecisao({
    distanciaDaMetaKm,
    distanciaMediaHistoricaKm,
    margemDeTolerancia,
  });

  if (gatilhoAcionado === GATILHO_DE_CONSTANCIA) {
    const ritmoProjetadoEmSegundosPorKm =
      calcularFormulaDeEvolucaoRecenteWMA(corridasExtraidas);

    return Object.freeze({
      distanciaDaMetaKm,
      distanciaMediaHistoricaKm,
      formulaAplicada: FORMULA_DE_EVOLUCAO_RECENTE,
      gatilhoAcionado,
      margemDeTolerancia,
      ritmoProjetadoEmSegundosPorKm,
      tempoTotalEstimadoEmSegundos:
        ritmoProjetadoEmSegundosPorKm * distanciaDaMetaKm,
    });
  }

  const tempoMedioHistoricoEmSegundos =
    calcularTempoMedioHistorico(corridasExtraidas);
  const tempoTotalEstimadoEmSegundos =
    calcularFormulaDeProjecaoComFadigaRiegel({
      distanciaDaMetaKm,
      distanciaMediaHistoricaKm,
      tempoMedioHistoricoEmSegundos,
    });

  return Object.freeze({
    distanciaDaMetaKm,
    distanciaMediaHistoricaKm,
    formulaAplicada: FORMULA_DE_PROJECAO_COM_FADIGA,
    gatilhoAcionado,
    margemDeTolerancia,
    ritmoProjetadoEmSegundosPorKm:
      tempoTotalEstimadoEmSegundos / distanciaDaMetaKm,
    tempoMedioHistoricoEmSegundos,
    tempoTotalEstimadoEmSegundos,
  });
}
