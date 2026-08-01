/**
 * Contrato espelhado da planilha_corrida.xlsx.
 *
 * `nome` preserva literalmente o cabeçalho da coluna para que o preenchimento
 * manual e a futura leitura da planilha produzam registros com as mesmas
 * chaves de negócio.
 */
export const CAMPOS_DA_PLANILHA_DE_TEMPOS = Object.freeze([
  Object.freeze({
    coluna: "A",
    nome: "Data da Corrida",
    identificador: "data-da-corrida",
    tipo: "date",
    obrigatorio: true,
    minimo: "2000-01-01",
    maximo: "2099-12-31",
  }),
  Object.freeze({
    coluna: "B",
    nome: "Nome da Corrida (Opcional)",
    identificador: "nome-da-corrida-opcional",
    tipo: "text",
    obrigatorio: false,
  }),
  Object.freeze({
    coluna: "C",
    nome: "Distância (km)",
    identificador: "distancia-km",
    tipo: "number",
    obrigatorio: true,
    minimo: 0,
    minimoExclusivo: true,
    passo: "any",
  }),
  Object.freeze({
    coluna: "D",
    nome: "Tempo (Horas)",
    identificador: "tempo-horas",
    tipo: "number",
    obrigatorio: true,
    minimo: 0,
    numeroInteiro: true,
    passo: 1,
  }),
  Object.freeze({
    coluna: "E",
    nome: "Tempo (Minutos)",
    identificador: "tempo-minutos",
    tipo: "number",
    obrigatorio: true,
    minimo: 0,
    maximo: 59,
    numeroInteiro: true,
    passo: 1,
  }),
  Object.freeze({
    coluna: "F",
    nome: "Tempo (Segundos)",
    identificador: "tempo-segundos",
    tipo: "number",
    obrigatorio: true,
    minimo: 0,
    maximo: 59,
    numeroInteiro: true,
    passo: 1,
  }),
]);

function estaVazio(valor) {
  return String(valor ?? "").trim() === "";
}

function dataEhValida(valor) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);

  if (!partes) {
    return false;
  }

  const [, ano, mes, dia] = partes.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

export function validarValorDaColuna(campo, valor) {
  if (estaVazio(valor)) {
    return campo.obrigatorio ? `Preencha o campo ${campo.nome}.` : "";
  }

  if (campo.tipo === "date") {
    if (!dataEhValida(valor)) {
      return `Informe uma ${campo.nome} válida.`;
    }

    if (valor < campo.minimo || valor > campo.maximo) {
      return `${campo.nome} deve estar entre 01/01/2000 e 31/12/2099.`;
    }

    return "";
  }

  if (campo.tipo !== "number") {
    return "";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return `${campo.nome} deve ser um número válido.`;
  }

  if (campo.numeroInteiro && !Number.isInteger(numero)) {
    return `${campo.nome} deve ser um número inteiro.`;
  }

  if (campo.minimoExclusivo && numero <= campo.minimo) {
    return `${campo.nome} deve ser maior que ${campo.minimo}.`;
  }

  if (campo.minimo !== undefined && numero < campo.minimo) {
    return `${campo.nome} deve ser no mínimo ${campo.minimo}.`;
  }

  if (campo.maximo !== undefined && numero > campo.maximo) {
    return `${campo.nome} deve ser no máximo ${campo.maximo}.`;
  }

  return "";
}

