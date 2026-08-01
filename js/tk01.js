import {
  CAMPOS_DA_PLANILHA_DE_TEMPOS,
  validarValorDaColuna,
} from "./campos-da-planilha-de-tempos.js";
import {
  validarFotoDePerfil,
  validarPlanilhaDeTempos,
} from "./validacao-de-arquivos.js";

const formulario = document.querySelector("#formulario-perfil-de-analise");
const nomeOuApelido = document.querySelector("#nome-ou-apelido");
const fotoDePerfil = document.querySelector("#foto-de-perfil");
const previewFotoImagem = document.querySelector("#preview-foto-imagem");
const previewFotoPlaceholder = document.querySelector(
  "#preview-foto-placeholder",
);
const planilhaDeTempos = document.querySelector("#planilha-de-tempos");
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

let temporizadorDoToast;
let enderecoDaPreviewDaFoto;
let numeroDaProximaCorrida = 1;

const camposDaPlanilhaPorNome = new Map(
  CAMPOS_DA_PLANILHA_DE_TEMPOS.map((campo) => [campo.nome, campo]),
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

function abrirModalDeProcessamento() {
  if (typeof modalProcessando.showModal === "function") {
    modalProcessando.showModal();
  } else {
    modalProcessando.setAttribute("open", "");
  }

  // TK-01 valida a entrada, mas ainda não lê o conteúdo da planilha.
  window.setTimeout(() => {
    if (typeof modalProcessando.close === "function") {
      modalProcessando.close();
    } else {
      modalProcessando.removeAttribute("open");
    }

    mostrarToast("EM DESENVOLVIMENTO");
  }, 1000);
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

  const nomeInvalido = definirErro(nomeOuApelido, erroNome, erroDoNome);
  const fotoInvalida = definirErro(
    fotoDePerfil,
    erroFoto,
    erroDaFoto,
  );
  const dadosInvalidos = manualAtivo
    ? definirErro(null, erroPreenchimentoManual, erroDosDados)
    : definirErro(planilhaDeTempos, erroPlanilha, erroDosDados);

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
  }

  return !(nomeInvalido || fotoInvalida || dadosInvalidos);
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

planilhaDeTempos.addEventListener("change", () => {
  const erro = validarPlanilhaDeTempos(planilhaDeTempos.files[0]);

  definirErro(
    planilhaDeTempos,
    erroPlanilha,
    erro,
  );

  if (erro) {
    mostrarToast(erro, "alert");
  }
});

nomeOuApelido.addEventListener("input", () => {
  if (nomeOuApelido.value.trim()) {
    definirErro(nomeOuApelido, erroNome, "");
  }
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (!validarFormulario()) {
    mostrarToast(
      "Revise os campos indicados antes de gerar a análise.",
      "alert",
    );
    return;
  }

  abrirModalDeProcessamento();
});

preencherCamposManuais();
alternarFonteDeDados();

