import { calcularRitmoPace } from "./ritmo-pace.js";

export const COLUNAS_DA_PLANILHA_DE_CORRIDAS = Object.freeze([
  "Data da Corrida",
  "Nome da Corrida (Opcional)",
  "Distância (km)",
  "Tempo (Horas)",
  "Tempo (Minutos)",
  "Tempo (Segundos)",
]);

const PRIMEIRA_LINHA_DE_DADOS = 6;

export class ErroDeExtracaoDeCorridas extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = "ErroDeExtracaoDeCorridas";
  }
}

function valorEstaVazio(valor) {
  return valor === null || valor === undefined || String(valor).trim() === "";
}

function criarDataDaCorridaIso(ano, mes, dia) {
  const dataDaCorrida = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    dataDaCorrida.getUTCFullYear() !== ano ||
    dataDaCorrida.getUTCMonth() !== mes - 1 ||
    dataDaCorrida.getUTCDate() !== dia
  ) {
    return "";
  }

  return [ano, mes, dia]
    .map((parte, indice) =>
      indice === 0 ? String(parte).padStart(4, "0") : String(parte).padStart(2, "0"),
    )
    .join("-");
}

function normalizarDataDaCorrida(valor, bibliotecaSheetJS) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return criarDataDaCorridaIso(
      valor.getUTCFullYear(),
      valor.getUTCMonth() + 1,
      valor.getUTCDate(),
    );
  }

  if (typeof valor === "number") {
    const partesDaData = bibliotecaSheetJS?.SSF?.parse_date_code?.(valor);

    if (partesDaData) {
      return criarDataDaCorridaIso(
        partesDaData.y,
        partesDaData.m,
        partesDaData.d,
      );
    }
  }

  const dataComoTexto = String(valor ?? "").trim();
  const dataIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataComoTexto);

  if (dataIso) {
    return criarDataDaCorridaIso(
      Number(dataIso[1]),
      Number(dataIso[2]),
      Number(dataIso[3]),
    );
  }

  const dataBrasileira = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
    dataComoTexto,
  );

  if (dataBrasileira) {
    return criarDataDaCorridaIso(
      Number(dataBrasileira[3]),
      Number(dataBrasileira[2]),
      Number(dataBrasileira[1]),
    );
  }

  return "";
}

function normalizarNumero(valor, nomeDaColuna, linhaDaPlanilha) {
  if (valorEstaVazio(valor)) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: preencha ${nomeDaColuna}.`,
    );
  }

  const numero =
    typeof valor === "string"
      ? Number(valor.trim().replace(",", "."))
      : Number(valor);

  if (!Number.isFinite(numero)) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: ${nomeDaColuna} deve ser um número válido.`,
    );
  }

  return numero;
}

function validarTempoInteiro(
  valor,
  nomeDaColuna,
  linhaDaPlanilha,
  { maximo } = {},
) {
  const tempo = normalizarNumero(valor, nomeDaColuna, linhaDaPlanilha);

  if (!Number.isInteger(tempo) || tempo < 0) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: ${nomeDaColuna} deve ser um inteiro maior ou igual a zero.`,
    );
  }

  if (maximo !== undefined && tempo > maximo) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: ${nomeDaColuna} deve estar entre 0 e ${maximo}.`,
    );
  }

  return tempo;
}

function linhaDaCorridaEstaVazia(linha) {
  return COLUNAS_DA_PLANILHA_DE_CORRIDAS.every((_, indice) =>
    valorEstaVazio(linha?.[indice]),
  );
}

function validarCabecalhoDaPlanilha(linhasDaPlanilha) {
  const cabecalho = linhasDaPlanilha[2] ?? [];

  for (const [indice, nomeDaColuna] of
    COLUNAS_DA_PLANILHA_DE_CORRIDAS.entries()) {
    if (String(cabecalho[indice] ?? "").trim() !== nomeDaColuna) {
      const letraDaColuna = String.fromCharCode(65 + indice);

      throw new ErroDeExtracaoDeCorridas(
        `A coluna ${letraDaColuna} deve se chamar “${nomeDaColuna}”.`,
      );
    }
  }
}

function extrairCorridaDaLinha(linha, linhaDaPlanilha, bibliotecaSheetJS) {
  const dataDaCorrida = normalizarDataDaCorrida(linha[0], bibliotecaSheetJS);

  if (!dataDaCorrida) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: Data da Corrida inválida.`,
    );
  }

  const nomeDaCorrida = valorEstaVazio(linha[1])
    ? ""
    : String(linha[1]).trim();
  const distanciaDaCorridaKm = normalizarNumero(
    linha[2],
    "Distância (km)",
    linhaDaPlanilha,
  );

  if (distanciaDaCorridaKm <= 0) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: Distância (km) deve ser maior que zero.`,
    );
  }

  const tempoHoras = validarTempoInteiro(
    linha[3],
    "Tempo (Horas)",
    linhaDaPlanilha,
  );
  const tempoMinutos = validarTempoInteiro(
    linha[4],
    "Tempo (Minutos)",
    linhaDaPlanilha,
    { maximo: 59 },
  );
  const tempoSegundos = validarTempoInteiro(
    linha[5],
    "Tempo (Segundos)",
    linhaDaPlanilha,
    { maximo: 59 },
  );
  const tempoTotalEmSegundos =
    tempoHoras * 3600 + tempoMinutos * 60 + tempoSegundos;

  if (tempoTotalEmSegundos <= 0) {
    throw new ErroDeExtracaoDeCorridas(
      `Linha ${linhaDaPlanilha}: o tempo total deve ser maior que zero.`,
    );
  }

  return Object.freeze({
    dataDaCorrida,
    nomeDaCorrida,
    distanciaDaCorridaKm,
    tempoHoras,
    tempoMinutos,
    tempoSegundos,
    tempoTotalEmSegundos,
    ritmoPaceEmSegundosPorKm: calcularRitmoPace(
      tempoTotalEmSegundos,
      distanciaDaCorridaKm,
    ),
  });
}

export function extrairCorridasDasLinhasDaPlanilha(
  linhasDaPlanilha,
  bibliotecaSheetJS,
) {
  validarCabecalhoDaPlanilha(linhasDaPlanilha);

  const corridasExtraidas = [];
  const linhasDeDados = linhasDaPlanilha.slice(PRIMEIRA_LINHA_DE_DADOS - 1);

  for (const [indice, linha] of linhasDeDados.entries()) {
    if (linhaDaCorridaEstaVazia(linha)) {
      continue;
    }

    corridasExtraidas.push(
      extrairCorridaDaLinha(
        linha,
        PRIMEIRA_LINHA_DE_DADOS + indice,
        bibliotecaSheetJS,
      ),
    );
  }

  if (corridasExtraidas.length === 0) {
    throw new ErroDeExtracaoDeCorridas(
      `Nenhuma corrida foi encontrada a partir da linha ${PRIMEIRA_LINHA_DE_DADOS}.`,
    );
  }

  return Object.freeze(corridasExtraidas);
}

export async function extrairCorridasDaPlanilha(
  arquivoDaPlanilha,
  bibliotecaSheetJS = globalThis.XLSX,
) {
  if (!bibliotecaSheetJS?.read || !bibliotecaSheetJS?.utils?.sheet_to_json) {
    throw new ErroDeExtracaoDeCorridas(
      "SheetJS não está disponível para ler a planilha.",
    );
  }

  try {
    const conteudoDaPlanilha = await arquivoDaPlanilha.arrayBuffer();
    const pastaDeTrabalho = bibliotecaSheetJS.read(conteudoDaPlanilha, {
      cellDates: true,
      type: "array",
    });
    const nomeDaPrimeiraPlanilha = pastaDeTrabalho.SheetNames[0];

    if (!nomeDaPrimeiraPlanilha) {
      throw new ErroDeExtracaoDeCorridas(
        "A planilha não possui uma aba com os registros de corrida.",
      );
    }

    const linhasDaPlanilha = bibliotecaSheetJS.utils.sheet_to_json(
      pastaDeTrabalho.Sheets[nomeDaPrimeiraPlanilha],
      {
        defval: null,
        header: 1,
        raw: true,
      },
    );

    return extrairCorridasDasLinhasDaPlanilha(
      linhasDaPlanilha,
      bibliotecaSheetJS,
    );
  } catch (erro) {
    if (erro instanceof ErroDeExtracaoDeCorridas) {
      throw erro;
    }

    throw new ErroDeExtracaoDeCorridas(
      "Não foi possível extrair os dados da planilha. Verifique se o arquivo está íntegro.",
    );
  }
}

export function extrairCorridasDoPreenchimentoManual(linhasDasCorridas) {
  const linhasDaPlanilha = [
    [],
    [],
    COLUNAS_DA_PLANILHA_DE_CORRIDAS,
    [],
    [],
    ...linhasDasCorridas,
  ];

  return extrairCorridasDasLinhasDaPlanilha(linhasDaPlanilha);
}
