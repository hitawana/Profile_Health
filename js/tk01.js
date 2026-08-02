import {
  CAMPOS_DA_PLANILHA_DE_TEMPOS,
  validarValorDaColuna,
} from "./campos-da-planilha-de-tempos.js";
import {
  extrairCorridasDaPlanilha,
  extrairCorridasDoPreenchimentoManual,
} from "./extracao-de-corridas.js";
import {
  calcularRitmoProjetado,
} from "./estimativa-de-ritmo.js";
import {
  apresentarFormulaDaEstimativa,
  apresentarGatilhoDaEstimativa,
} from "./apresentacao-da-estimativa.js";
import {
  adicionarRitmoProjetadoAoHistorico,
  renderizarHistoricoDeRitmo,
} from "./historico-de-ritmo.js";
import {
  CAMPOS_DA_META_DA_PROXIMA_CORRIDA,
  criarMetaDaProximaCorrida,
  validarValorDoCampoDaMetaDaProximaCorrida,
} from "./meta-da-proxima-corrida.js";
import { formatarRitmoPace } from "./ritmo-pace.js";
import {
  validarFotoDePerfil,
  validarPlanilhaDeTempos,
} from "./validacao-de-arquivos.js";

const telaDeEntrada = document.querySelector("#tela-de-entrada");
const painelAnalitico = document.querySelector("#painel-analitico");
const formulario = document.querySelector("#formulario-perfil-de-analise");
const nomeOuApelido = document.querySelector("#nome-ou-apelido");
const fotoDePerfil = document.querySelector("#foto-de-perfil");
const previewFotoImagem = document.querySelector("#preview-foto-imagem");
const previewFotoPlaceholder = document.querySelector(
  "#preview-foto-placeholder",
);
const avatarDoCta = document.querySelector("#avatar-do-cta");
const avatarDoCtaPlaceholder = document.querySelector(
  "#avatar-do-cta-placeholder",
);
const planilhaDeTempos = document.querySelector("#planilha-de-tempos");
const passoDownloadTemplate = document.querySelector(
  "#passo-download-template",
);
const passoEnvioPlanilha = document.querySelector(
  "#passo-envio-planilha",
);
const baixarTemplateDeCorridas = document.querySelector(
  "#baixar-template-de-corridas",
);
const textoDownloadTemplate = document.querySelector(
  "#texto-download-template",
);
const estadoDownloadTemplate = document.querySelector(
  "#estado-download-template",
);
const controleDeEnvioDaPlanilha = document.querySelector(
  "#controle-de-envio-da-planilha",
);
const nomeDaPlanilhaSelecionada = document.querySelector(
  "#nome-da-planilha-selecionada",
);
const enviarPlanilhaPreenchida = document.querySelector(
  "#enviar-planilha-preenchida",
);
const textoEnvioPlanilha = document.querySelector(
  "#texto-envio-planilha",
);
const progressoDoEnvioDaPlanilha = document.querySelector(
  "#progresso-do-envio-da-planilha",
);
const estadoEnvioPlanilha = document.querySelector(
  "#estado-envio-planilha",
);
const fontesDeDadosDaCorrida = document.querySelectorAll(
  'input[name="fonteDeDadosDaCorrida"]',
);
const entradaPlanilha = document.querySelector(
  "#entrada-planilha-de-tempos",
);
const entradaManual = document.querySelector(
  "#entrada-preenchimento-manual",
);
const camposDaPlanilha = document.querySelector("#campos-da-planilha");
const adicionarCorrida = document.querySelector("#adicionar-corrida");
const formularioMetaDaProximaCorrida = document.querySelector(
  ".meta-da-proxima-corrida",
);
const camposDaMetaDaProximaCorrida = document.querySelectorAll(
  "input[data-campo-da-meta]",
);
const estadoPreenchimentoManual = document.querySelector(
  "#estado-preenchimento-manual",
);
const erroNome = document.querySelector("#erro-nome-ou-apelido");
const erroFoto = document.querySelector("#erro-foto-de-perfil");
const erroPlanilha = document.querySelector("#erro-planilha-de-tempos");
const erroPreenchimentoManual = document.querySelector(
  "#erro-preenchimento-manual",
);
const toast = document.querySelector("#toast");
const mensagemToast = document.querySelector("#mensagem-toast");
const modalProcessando = document.querySelector("#modal-processando");
const fotoDoPainel = document.querySelector("#foto-do-painel");
const tituloDoPainel = document.querySelector("#titulo-do-painel");
const resumoDoPainel = document.querySelector("#resumo-do-painel");
const ritmoProjetado = document.querySelector("#ritmo-projetado");
const distanciaMediaHistorica = document.querySelector(
  "#distancia-media-historica",
);
const distanciaDaMeta = document.querySelector("#distancia-da-meta");
const margemDeTolerancia = document.querySelector(
  "#margem-de-tolerancia",
);
const gatilhoAcionado = document.querySelector("#gatilho-acionado");
const detalheDoGatilhoAcionado = document.querySelector(
  "#detalhe-do-gatilho-acionado",
);
const formulaAplicada = document.querySelector("#formula-aplicada");
const detalheDaFormulaAplicada = document.querySelector(
  "#detalhe-da-formula-aplicada",
);
const tempoTotalEstimado = document.querySelector(
  "#tempo-total-estimado",
);
const graficoDoHistoricoDeRitmo = document.querySelector(
  "#grafico-do-historico-de-ritmo",
);
const iniciarNovaAnalise = document.querySelector("#iniciar-nova-analise");
const fichaMetaNomeDaCorrida = document.querySelector(
  "#ficha-meta-nome-da-corrida",
);
const fichaMetaLocal = document.querySelector("#ficha-meta-local");
const fichaMetaData = document.querySelector("#ficha-meta-data");
const fichaMetaHorario = document.querySelector("#ficha-meta-horario");
const fichaMetaDistancia = document.querySelector("#ficha-meta-distancia");

let temporizadorDoToast;
let temporizadorDoEnvioDaPlanilha;
let enderecoDaPreviewDaFoto;
let numeroDaProximaCorrida = 1;
let instanciaDoGraficoDoHistorico;
let metaDaProximaCorridaAtual;
let downloadDoTemplateConcluido = false;

const DURACAO_DO_ENVIO_VISUAL_EM_MS = 900;

const formatadorDeDistancia = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const formatadorDePercentual = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
  style: "percent",
});

const formatadorDaDataDaMeta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const camposDaPlanilhaPorNome = new Map(
  CAMPOS_DA_PLANILHA_DE_TEMPOS.map((campo) => [campo.nome, campo]),
);

const camposDaMetaPorChave = new Map(
  CAMPOS_DA_META_DA_PROXIMA_CORRIDA.map((campo) => [campo.chave, campo]),
);

function fonteDeDadosSelecionada() {
  return document.querySelector(
    'input[name="fonteDeDadosDaCorrida"]:checked',
  )?.value;
}

function aplicarRestricoesDaColuna(entrada, campo) {
  if (campo.minimo !== undefined) {
    entrada.min = String(campo.minimo);
  }

  if (campo.maximo !== undefined) {
    entrada.max = String(campo.maximo);
  }

  if (campo.passo !== undefined) {
    entrada.step = String(campo.passo);
  }
}

function criarCampoDaCorrida(campo, numeroDaCorrida) {
  const grupo = document.createElement("div");
  const rotulo = document.createElement("label");
  const entrada = document.createElement("input");
  const erro = document.createElement("p");
  const identificador = `${campo.identificador}-corrida-${numeroDaCorrida}`;
  const identificadorDoErro = `erro-${identificador}`;

  grupo.className = "grupo-de-campo";
  rotulo.htmlFor = identificador;
  rotulo.textContent = campo.nome;

  entrada.id = identificador;
  entrada.name = campo.nome;
  entrada.type = campo.tipo;
  entrada.required = campo.obrigatorio;
  entrada.dataset.colunaDaPlanilha = campo.nome;
  entrada.setAttribute("aria-describedby", identificadorDoErro);
  aplicarRestricoesDaColuna(entrada, campo);

  if (campo.tipo === "number") {
    entrada.inputMode = campo.numeroInteiro ? "numeric" : "decimal";
  }

  erro.className = "erro";
  erro.id = identificadorDoErro;
  erro.setAttribute("aria-atomic", "true");
  erro.setAttribute("aria-live", "polite");

  grupo.append(rotulo, entrada, erro);

  return grupo;
}

function criarCorridaManual(numeroDaCorrida) {
  const corrida = document.createElement("fieldset");
  const titulo = document.createElement("legend");
  const campos = document.createElement("div");

  corrida.className = "corrida-manual";
  corrida.dataset.numeroDaCorrida = String(numeroDaCorrida);
  titulo.textContent = `Corrida ${numeroDaCorrida}`;
  campos.className = "corrida-manual__campos";

  for (const campo of CAMPOS_DA_PLANILHA_DE_TEMPOS) {
    campos.append(criarCampoDaCorrida(campo, numeroDaCorrida));
  }

  corrida.append(titulo, campos);

  return corrida;
}

function adicionarCorridaManual({ moverFoco = false } = {}) {
  const numeroDaCorrida = numeroDaProximaCorrida;
  const corrida = criarCorridaManual(numeroDaCorrida);

  numeroDaProximaCorrida += 1;
  camposDaPlanilha.append(corrida);

  if (moverFoco) {
    estadoPreenchimentoManual.textContent = `Corrida ${numeroDaCorrida} adicionada.`;
    corrida.querySelector("input")?.focus();
  }
}

function preencherCamposManuais() {
  camposDaPlanilha.replaceChildren();
  numeroDaProximaCorrida = 1;
  adicionarCorridaManual();
}

function validarCampoDaCorridaManual(entrada) {
  const campo = camposDaPlanilhaPorNome.get(
    entrada.dataset.colunaDaPlanilha,
  );
  const elementoDoErro = document.querySelector(
    `#${entrada.getAttribute("aria-describedby")}`,
  );
  const mensagem = validarValorDaColuna(campo, entrada.value);

  return definirErro(entrada, elementoDoErro, mensagem);
}

function alternarFonteDeDados() {
  const preenchimentoManualAtivo =
    fonteDeDadosSelecionada() === "preenchimento-manual";

  entradaPlanilha.hidden = preenchimentoManualAtivo;
  planilhaDeTempos.disabled = preenchimentoManualAtivo;
  planilhaDeTempos.required = !preenchimentoManualAtivo;

  entradaManual.hidden = !preenchimentoManualAtivo;
  definirErro(planilhaDeTempos, erroPlanilha, "");
  definirErro(null, erroPreenchimentoManual, "");
}

function ativarPassoDeEnvioDaPlanilha() {
  passoDownloadTemplate.dataset.estado = "concluido";
  passoEnvioPlanilha.dataset.estado = "ativo";
}

function concluirPassoDeEnvioDaPlanilha() {
  passoEnvioPlanilha.dataset.estado = "concluido";
}

function atualizarEstadoVisualDoEnvioDaPlanilha(arquivo, erro = "") {
  window.clearTimeout(temporizadorDoEnvioDaPlanilha);
  temporizadorDoEnvioDaPlanilha = undefined;
  progressoDoEnvioDaPlanilha.hidden = true;
  progressoDoEnvioDaPlanilha.removeAttribute("aria-valuenow");
  progressoDoEnvioDaPlanilha.setAttribute(
    "aria-valuetext",
    "Aguardando envio",
  );

  if (downloadDoTemplateConcluido) {
    ativarPassoDeEnvioDaPlanilha();
  }

  if (!arquivo) {
    controleDeEnvioDaPlanilha.dataset.estado = "vazio";
    nomeDaPlanilhaSelecionada.textContent = "Nenhum arquivo selecionado";
    textoEnvioPlanilha.textContent = "Selecionar arquivo";
    estadoEnvioPlanilha.textContent = downloadDoTemplateConcluido
      ? "Selecione um arquivo .xlsx."
      : "Conclua o Passo 1 para selecionar o arquivo.";
    enviarPlanilhaPreenchida.disabled = !downloadDoTemplateConcluido;
    return;
  }

  nomeDaPlanilhaSelecionada.textContent = arquivo.name;

  if (erro) {
    controleDeEnvioDaPlanilha.dataset.estado = "erro";
    textoEnvioPlanilha.textContent = "Selecionar novamente";
    estadoEnvioPlanilha.textContent = "Selecione um arquivo .xlsx válido.";
    enviarPlanilhaPreenchida.disabled = !downloadDoTemplateConcluido;
    return;
  }

  controleDeEnvioDaPlanilha.dataset.estado = "anexado";
  textoEnvioPlanilha.textContent = downloadDoTemplateConcluido
    ? "Enviar arquivo"
    : "Conclua o Passo 1";
  estadoEnvioPlanilha.textContent = downloadDoTemplateConcluido
    ? "Arquivo anexado e pronto para enviar."
    : "Arquivo anexado. Baixe o template para avançar.";
  enviarPlanilhaPreenchida.disabled = !downloadDoTemplateConcluido;
}

function concluirDownloadDoTemplate() {
  downloadDoTemplateConcluido = true;
  textoDownloadTemplate.textContent = "Template baixado";
  estadoDownloadTemplate.textContent = "Download concluído. Avance para o envio.";
  ativarPassoDeEnvioDaPlanilha();

  const arquivo = planilhaDeTempos.files[0];
  const erro = arquivo ? validarPlanilhaDeTempos(arquivo) : "";
  atualizarEstadoVisualDoEnvioDaPlanilha(arquivo, erro);
}

function iniciarEnvioVisualDaPlanilha() {
  const arquivo = planilhaDeTempos.files[0];
  const erro = validarPlanilhaDeTempos(arquivo);

  if (erro || !downloadDoTemplateConcluido) {
    definirErro(planilhaDeTempos, erroPlanilha, erro);

    if (erro) {
      mostrarToast(erro, "alert");
    }

    return;
  }

  controleDeEnvioDaPlanilha.dataset.estado = "enviando";
  textoEnvioPlanilha.textContent = "Enviando...";
  estadoEnvioPlanilha.textContent = "Enviando arquivo preenchido...";
  enviarPlanilhaPreenchida.disabled = true;
  progressoDoEnvioDaPlanilha.hidden = false;
  progressoDoEnvioDaPlanilha.setAttribute("aria-valuenow", "0");
  progressoDoEnvioDaPlanilha.setAttribute("aria-valuetext", "Enviando");

  const movimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const duracaoDoEnvio = movimentoReduzido
    ? 0
    : DURACAO_DO_ENVIO_VISUAL_EM_MS;

  temporizadorDoEnvioDaPlanilha = window.setTimeout(() => {
    controleDeEnvioDaPlanilha.dataset.estado = "concluido";
    textoEnvioPlanilha.textContent = "Concluído";
    estadoEnvioPlanilha.textContent = "Arquivo pronto para análise.";
    progressoDoEnvioDaPlanilha.setAttribute("aria-valuenow", "100");
    progressoDoEnvioDaPlanilha.setAttribute("aria-valuetext", "Concluído");
    progressoDoEnvioDaPlanilha.hidden = true;
    concluirPassoDeEnvioDaPlanilha();
  }, duracaoDoEnvio);
}

function mostrarToast(mensagem, tipo = "status") {
  window.clearTimeout(temporizadorDoToast);

  const estadoDeErro = tipo === "alert";

  mensagemToast.textContent = estadoDeErro ? `Erro: ${mensagem}` : mensagem;
  toast.setAttribute("role", tipo);
  toast.dataset.estado = estadoDeErro ? "erro" : "status";
  toast.hidden = false;

  temporizadorDoToast = window.setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}

function definirErro(campo, elementoDoErro, mensagem) {
  const possuiErro = Boolean(mensagem);
  const estadoEmDesenvolvimento = mensagem === "EM DESENVOLVIMENTO";

  elementoDoErro.textContent = possuiErro
    ? estadoEmDesenvolvimento
      ? mensagem
      : `Erro: ${mensagem}`
    : "";

  if (campo) {
    if (possuiErro) {
      campo.setAttribute("aria-invalid", "true");
    } else {
      campo.removeAttribute("aria-invalid");
    }
  }

  return possuiErro;
}

function limparPreviewDaFoto() {
  if (enderecoDaPreviewDaFoto) {
    URL.revokeObjectURL(enderecoDaPreviewDaFoto);
    enderecoDaPreviewDaFoto = undefined;
  }

  previewFotoImagem.removeAttribute("src");
  previewFotoImagem.hidden = true;
  previewFotoPlaceholder.hidden = false;
  avatarDoCta.removeAttribute("src");
  avatarDoCta.hidden = true;
  avatarDoCtaPlaceholder.hidden = false;
}

function atualizarPreviewDaFoto(arquivo) {
  limparPreviewDaFoto();

  if (!arquivo || validarFotoDePerfil(arquivo)) {
    return;
  }

  enderecoDaPreviewDaFoto = URL.createObjectURL(arquivo);
  previewFotoImagem.src = enderecoDaPreviewDaFoto;
  previewFotoImagem.hidden = false;
  previewFotoPlaceholder.hidden = true;
  avatarDoCta.src = enderecoDaPreviewDaFoto;
  avatarDoCta.hidden = false;
  avatarDoCtaPlaceholder.hidden = true;
}

function validarNomeOuApelido() {
  return nomeOuApelido.value.trim()
    ? ""
    : "Informe seu nome ou apelido.";
}

function validarPreenchimentoManual() {
  let primeiroCampoInvalido;

  for (const entrada of camposDaPlanilha.querySelectorAll(
    "input[data-coluna-da-planilha]",
  )) {
    const campoInvalido = validarCampoDaCorridaManual(entrada);

    if (campoInvalido && !primeiroCampoInvalido) {
      primeiroCampoInvalido = entrada;
    }
  }

  return {
    mensagem: primeiroCampoInvalido
      ? "Revise os dados das corridas indicados."
      : "",
    primeiroCampoInvalido,
  };
}

function validarCampoDaMetaDaProximaCorrida(entrada) {
  const campo = camposDaMetaPorChave.get(entrada.dataset.campoDaMeta);
  const elementoDoErro = document.querySelector(
    `#${entrada.getAttribute("aria-describedby")}`,
  );
  const mensagem = validarValorDoCampoDaMetaDaProximaCorrida(
    campo,
    entrada.value,
  );

  return definirErro(entrada, elementoDoErro, mensagem);
}

function validarFormularioDaMetaDaProximaCorrida() {
  let primeiroCampoInvalido;

  for (const entrada of camposDaMetaDaProximaCorrida) {
    const campoInvalido = validarCampoDaMetaDaProximaCorrida(entrada);

    if (campoInvalido && !primeiroCampoInvalido) {
      primeiroCampoInvalido = entrada;
    }
  }

  return { primeiroCampoInvalido };
}

function obterMetaDaProximaCorridaInformada() {
  const valoresInformados = Object.fromEntries(
    [...camposDaMetaDaProximaCorrida].map((entrada) => [
      entrada.dataset.campoDaMeta,
      entrada.value,
    ]),
  );

  return criarMetaDaProximaCorrida(valoresInformados);
}

function obterLinhasDoPreenchimentoManual() {
  return [...camposDaPlanilha.querySelectorAll(".corrida-manual")].map(
    (corridaManual) =>
      [...corridaManual.querySelectorAll("input[data-coluna-da-planilha]")].map(
        (entrada) => entrada.value,
      ),
  );
}

async function extrairCorridasInformadas() {
  if (fonteDeDadosSelecionada() === "preenchimento-manual") {
    return extrairCorridasDoPreenchimentoManual(
      obterLinhasDoPreenchimentoManual(),
    );
  }

  return extrairCorridasDaPlanilha(planilhaDeTempos.files[0]);
}

function lerTokenNumerico(nomeDoToken) {
  return Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(nomeDoToken),
  );
}

function obterVisualizacaoDoDesignSystem() {
  const tokens = getComputedStyle(document.documentElement);

  return Object.freeze({
    corAccent: tokens.getPropertyValue("--cor-accent").trim(),
    corAccentSoft: tokens.getPropertyValue("--cor-accent-soft").trim(),
    corDivider: tokens.getPropertyValue("--cor-divider").trim(),
    corSupport: tokens.getPropertyValue("--cor-support").trim(),
    corSurface: tokens.getPropertyValue("--cor-surface").trim(),
    corTextoPrimario: tokens
      .getPropertyValue("--cor-texto-primario")
      .trim(),
    corTextoSecundario: tokens
      .getPropertyValue("--cor-texto-secundario")
      .trim(),
    espaco1: lerTokenNumerico("--espaco-1"),
    espaco2: lerTokenNumerico("--espaco-2"),
    espaco3: lerTokenNumerico("--espaco-3"),
    espaco5: lerTokenNumerico("--espaco-5"),
    fonteCorpo: tokens.getPropertyValue("--fonte-corpo").trim(),
    fonteDados: tokens.getPropertyValue("--fonte-dados").trim(),
  });
}

function formatarDistancia(distanciaEmKm) {
  return `${formatadorDeDistancia.format(distanciaEmKm)} km`;
}

function formatarTempoTotal(tempoTotalEmSegundos) {
  const totalArredondado = Math.round(tempoTotalEmSegundos);
  const horas = Math.floor(totalArredondado / 3600);
  const minutos = Math.floor((totalArredondado % 3600) / 60);
  const segundos = totalArredondado % 60;

  return [horas, minutos, segundos]
    .map((parte) => String(parte).padStart(2, "0"))
    .join(":");
}

function formatarDataDaMeta(data) {
  return data
    ? formatadorDaDataDaMeta.format(new Date(`${data}T00:00:00Z`))
    : "—";
}

function formatarHorarioDaLargada(horarioDaLargada) {
  return horarioDaLargada ? horarioDaLargada.replace(":", "h") : "—";
}

function preencherPainelAnalitico(
  corridasExtraidas,
  estimativa,
  metaDaProximaCorrida,
) {
  const quantidadeDeCorridas = corridasExtraidas.length;
  const apresentacaoDoGatilho = apresentarGatilhoDaEstimativa(
    estimativa.gatilhoAcionado,
    estimativa,
  );
  const apresentacaoDaFormula = apresentarFormulaDaEstimativa(
    estimativa.formulaAplicada,
    estimativa,
  );

  fotoDoPainel.src = enderecoDaPreviewDaFoto;
  fotoDoPainel.alt = `Foto de perfil de ${nomeOuApelido.value.trim()}`;
  tituloDoPainel.textContent = nomeOuApelido.value.trim();
  resumoDoPainel.textContent = `${quantidadeDeCorridas} ${
    quantidadeDeCorridas === 1 ? "corrida analisada" : "corridas analisadas"
  }.`;
  ritmoProjetado.textContent = formatarRitmoPace(
    estimativa.ritmoProjetadoEmSegundosPorKm,
  );
  distanciaMediaHistorica.textContent = formatarDistancia(
    estimativa.distanciaMediaHistoricaKm,
  );
  distanciaDaMeta.textContent = formatarDistancia(
    estimativa.distanciaDaMetaKm,
  );
  margemDeTolerancia.textContent = `±${formatadorDePercentual.format(
    estimativa.margemDeTolerancia,
  )} da distância média`;
  gatilhoAcionado.textContent = apresentacaoDoGatilho.mensagem;
  detalheDoGatilhoAcionado.textContent =
    apresentacaoDoGatilho.detalheTecnico;
  formulaAplicada.textContent = apresentacaoDaFormula.mensagem;
  detalheDaFormulaAplicada.textContent =
    apresentacaoDaFormula.detalheTecnico;
  tempoTotalEstimado.textContent = formatarTempoTotal(
    estimativa.tempoTotalEstimadoEmSegundos,
  );
  fichaMetaNomeDaCorrida.textContent =
    metaDaProximaCorrida.nomeDaCorrida || "—";
  fichaMetaLocal.textContent = metaDaProximaCorrida.local || "—";
  fichaMetaData.textContent = formatarDataDaMeta(metaDaProximaCorrida.data);
  fichaMetaHorario.textContent = formatarHorarioDaLargada(
    metaDaProximaCorrida.horarioDaLargada,
  );
  fichaMetaDistancia.textContent = formatarDistancia(
    metaDaProximaCorrida.distanciaKm,
  );
}

function exibirPainelAnalitico(corridasExtraidas, metaDaProximaCorrida) {
  telaDeEntrada.hidden = true;
  painelAnalitico.hidden = false;

  instanciaDoGraficoDoHistorico?.destroy();
  instanciaDoGraficoDoHistorico = renderizarHistoricoDeRitmo({
    bibliotecaChart: window.Chart,
    canvasDoHistorico: graficoDoHistoricoDeRitmo,
    corridasExtraidas,
    visualizacaoDoDesignSystem: obterVisualizacaoDoDesignSystem(),
  });

  // A estimativa só é calculada depois que o histórico extraído foi renderizado.
  const estimativa = calcularRitmoProjetado({
    corridasExtraidas,
    distanciaDaMetaKm: metaDaProximaCorrida.distanciaKm,
  });

  adicionarRitmoProjetadoAoHistorico({
    graficoDoHistorico: instanciaDoGraficoDoHistorico,
    ritmoProjetadoEmSegundosPorKm:
      estimativa.ritmoProjetadoEmSegundosPorKm,
    visualizacaoDoDesignSystem: obterVisualizacaoDoDesignSystem(),
  });

  metaDaProximaCorridaAtual = metaDaProximaCorrida;
  preencherPainelAnalitico(
    corridasExtraidas,
    estimativa,
    metaDaProximaCorridaAtual,
  );
  document.title = "Painel analítico | Profile Analytics";
  window.scrollTo({ behavior: "smooth", top: 0 });
}

function exibirTelaDeEntrada({ moverFoco = false } = {}) {
  instanciaDoGraficoDoHistorico?.destroy();
  instanciaDoGraficoDoHistorico = undefined;
  painelAnalitico.hidden = true;
  telaDeEntrada.hidden = false;
  document.title = "Boas-vindas | Profile Analytics";
  window.scrollTo({ behavior: "smooth", top: 0 });

  if (moverFoco) {
    nomeOuApelido.focus();
  }
}

function abrirModalDeProcessamento() {
  if (typeof modalProcessando.showModal === "function") {
    modalProcessando.showModal();
  } else {
    modalProcessando.setAttribute("open", "");
  }

}

function fecharModalDeProcessamento() {
  if (typeof modalProcessando.close === "function") {
    modalProcessando.close();
  } else {
    modalProcessando.removeAttribute("open");
  }
}

function validarFormulario() {
  const erroDoNome = validarNomeOuApelido();
  const erroDaFoto = validarFotoDePerfil(fotoDePerfil.files[0]);
  const manualAtivo = fonteDeDadosSelecionada() === "preenchimento-manual";
  const validacaoManual = manualAtivo
    ? validarPreenchimentoManual()
    : { mensagem: "", primeiroCampoInvalido: null };
  const erroDosDados = manualAtivo
    ? validacaoManual.mensagem
    : validarPlanilhaDeTempos(planilhaDeTempos.files[0]);
  const validacaoDaMeta = validarFormularioDaMetaDaProximaCorrida();

  const nomeInvalido = definirErro(nomeOuApelido, erroNome, erroDoNome);
  const fotoInvalida = definirErro(
    fotoDePerfil,
    erroFoto,
    erroDaFoto,
  );
  const dadosInvalidos = manualAtivo
    ? definirErro(null, erroPreenchimentoManual, erroDosDados)
    : definirErro(planilhaDeTempos, erroPlanilha, erroDosDados);
  const metaInvalida = Boolean(validacaoDaMeta.primeiroCampoInvalido);

  if (nomeInvalido) {
    nomeOuApelido.focus();
  } else if (fotoInvalida) {
    fotoDePerfil.focus();
  } else if (dadosInvalidos) {
    if (manualAtivo) {
      validacaoManual.primeiroCampoInvalido?.focus();
    } else {
      planilhaDeTempos.focus();
    }
  } else if (metaInvalida) {
    validacaoDaMeta.primeiroCampoInvalido.focus();
  }

  return !(nomeInvalido || fotoInvalida || dadosInvalidos || metaInvalida);
}

for (const fonteDeDados of fontesDeDadosDaCorrida) {
  fonteDeDados.addEventListener("change", alternarFonteDeDados);
}

adicionarCorrida.addEventListener("click", () => {
  adicionarCorridaManual({ moverFoco: true });
});

camposDaPlanilha.addEventListener("change", (evento) => {
  if (evento.target.matches("input[data-coluna-da-planilha]")) {
    validarCampoDaCorridaManual(evento.target);
    definirErro(null, erroPreenchimentoManual, "");
  }
});

camposDaPlanilha.addEventListener("input", (evento) => {
  if (
    evento.target.matches('input[data-coluna-da-planilha][aria-invalid="true"]')
  ) {
    validarCampoDaCorridaManual(evento.target);
    definirErro(null, erroPreenchimentoManual, "");
  }
});

fotoDePerfil.addEventListener("change", () => {
  const arquivo = fotoDePerfil.files[0];
  const erro = validarFotoDePerfil(arquivo);

  definirErro(fotoDePerfil, erroFoto, erro);
  atualizarPreviewDaFoto(arquivo);

  if (erro) {
    mostrarToast(erro, "alert");
  }
});

previewFotoImagem.addEventListener("error", () => {
  limparPreviewDaFoto();
  definirErro(
    fotoDePerfil,
    erroFoto,
    "A foto selecionada é inválida ou está corrompida.",
  );
  mostrarToast(
    "A foto selecionada é inválida ou está corrompida.",
    "alert",
  );
});

baixarTemplateDeCorridas.addEventListener("click", () => {
  concluirDownloadDoTemplate();
});

enviarPlanilhaPreenchida.addEventListener("click", () => {
  const arquivo = planilhaDeTempos.files[0];
  const erro = arquivo ? validarPlanilhaDeTempos(arquivo) : "";

  if (!arquivo || erro) {
    planilhaDeTempos.click();
    return;
  }

  iniciarEnvioVisualDaPlanilha();
});

planilhaDeTempos.addEventListener("change", () => {
  const arquivo = planilhaDeTempos.files[0];
  const erro = validarPlanilhaDeTempos(arquivo);

  definirErro(
    planilhaDeTempos,
    erroPlanilha,
    erro,
  );
  atualizarEstadoVisualDoEnvioDaPlanilha(arquivo, erro);

  if (erro) {
    mostrarToast(erro, "alert");
  }
});

nomeOuApelido.addEventListener("input", () => {
  if (nomeOuApelido.value.trim()) {
    definirErro(nomeOuApelido, erroNome, "");
  }
});

formularioMetaDaProximaCorrida.addEventListener("change", (evento) => {
  if (evento.target.matches("input[data-campo-da-meta]")) {
    validarCampoDaMetaDaProximaCorrida(evento.target);
  }
});

formularioMetaDaProximaCorrida.addEventListener("input", (evento) => {
  if (evento.target.matches('input[data-campo-da-meta][aria-invalid="true"]')) {
    validarCampoDaMetaDaProximaCorrida(evento.target);
  }
});

iniciarNovaAnalise.addEventListener("click", () => {
  exibirTelaDeEntrada({ moverFoco: true });
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!validarFormulario()) {
    mostrarToast(
      "Revise os campos indicados antes de gerar a análise.",
      "alert",
    );
    return;
  }

  const metaDaProximaCorrida = obterMetaDaProximaCorridaInformada();

  abrirModalDeProcessamento();

  try {
    await new Promise((resolver) => window.requestAnimationFrame(resolver));

    const corridasExtraidas = await extrairCorridasInformadas();

    console.log("Array de corridas extraído:", corridasExtraidas);
    exibirPainelAnalitico(corridasExtraidas, metaDaProximaCorrida);
    mostrarToast(
      `${corridasExtraidas.length} corrida(s) analisada(s) com sucesso.`,
    );
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : "Não foi possível extrair os dados das corridas.";
    const preenchimentoManualAtivo =
      fonteDeDadosSelecionada() === "preenchimento-manual";

    exibirTelaDeEntrada();

    if (preenchimentoManualAtivo) {
      definirErro(null, erroPreenchimentoManual, mensagem);
      entradaManual.focus();
    } else {
      definirErro(planilhaDeTempos, erroPlanilha, mensagem);
      planilhaDeTempos.focus();
    }

    mostrarToast(mensagem, "alert");
  } finally {
    fecharModalDeProcessamento();
  }
});

preencherCamposManuais();
alternarFonteDeDados();
atualizarEstadoVisualDoEnvioDaPlanilha();

