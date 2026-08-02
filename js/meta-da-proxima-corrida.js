export const CAMPOS_DA_META_DA_PROXIMA_CORRIDA = Object.freeze([
  Object.freeze({
    chave: "nomeDaCorrida",
    nome: "Nome da Corrida",
    obrigatorio: false,
    tipo: "text",
  }),
  Object.freeze({
    chave: "local",
    nome: "Local",
    obrigatorio: false,
    tipo: "text",
  }),
  Object.freeze({
    chave: "data",
    maximo: "2099-12-31",
    minimo: "2000-01-01",
    nome: "Data",
    obrigatorio: false,
    tipo: "date",
  }),
  Object.freeze({
    chave: "horarioDaLargada",
    nome: "Horário da Largada",
    obrigatorio: false,
    tipo: "time",
  }),
  Object.freeze({
    chave: "distanciaKm",
    minimo: 0,
    minimoExclusivo: true,
    nome: "Distância (km)",
    obrigatorio: true,
    tipo: "number",
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

export function validarValorDoCampoDaMetaDaProximaCorrida(campo, valor) {
  if (estaVazio(valor)) {
    return campo.obrigatorio ? `Preencha o campo ${campo.nome}.` : "";
  }

  if (campo.tipo === "date") {
    if (!dataEhValida(valor)) {
      return "Informe uma Data válida.";
    }

    if (valor < campo.minimo || valor > campo.maximo) {
      return "Data deve estar entre 01/01/2000 e 31/12/2099.";
    }
  }

  if (campo.tipo === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)) {
    return "Informe um Horário da Largada válido.";
  }

  if (campo.tipo === "number") {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return `${campo.nome} deve ser um número válido.`;
    }

    if (campo.minimoExclusivo && numero <= campo.minimo) {
      return `${campo.nome} deve ser maior que ${campo.minimo}.`;
    }
  }

  return "";
}

export function criarMetaDaProximaCorrida(valoresInformados) {
  for (const campo of CAMPOS_DA_META_DA_PROXIMA_CORRIDA) {
    const mensagem = validarValorDoCampoDaMetaDaProximaCorrida(
      campo,
      valoresInformados[campo.chave],
    );

    if (mensagem) {
      throw new TypeError(mensagem);
    }
  }

  return Object.freeze({
    data: String(valoresInformados.data ?? "").trim(),
    distanciaKm: Number(valoresInformados.distanciaKm),
    horarioDaLargada: String(
      valoresInformados.horarioDaLargada ?? "",
    ).trim(),
    local: String(valoresInformados.local ?? "").trim(),
    nomeDaCorrida: String(valoresInformados.nomeDaCorrida ?? "").trim(),
  });
}
