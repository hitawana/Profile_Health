import { CAMPOS_DA_PLANILHA_DE_TEMPOS } from "./campos-da-planilha-de-tempos.js";
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

function fonteDeDadosSelecionada() {
  return document.querySelector(
    'input[name="fonteDeDadosDaCorrida"]:checked',
  )?.value;
}

function preencherCamposManuais() {
  camposDaPlanilha.replaceChildren();

  if (CAMPOS_DA_PLANILHA_DE_TEMPOS.length === 0) {
    const aviso = document.createElement("p");
    aviso.className = "estado-em-desenvolvimento";
    aviso.textContent = "EM DESENVOLVIMENTO";
    camposDaPlanilha.append(aviso);
    return;
  }

  for (const campo of CAMPOS_DA_PLANILHA_DE_TEMPOS) {
    const grupo = document.createElement("div");
    const rotulo = document.createElement("label");
    const entrada = document.createElement("input");

    rotulo.htmlFor = campo.nome;
    rotulo.textContent = campo.rotulo;

    entrada.id = campo.nome;
    entrada.name = campo.nome;
    entrada.type = campo.tipo;
    entrada.required = campo.obrigatorio;

    grupo.append(rotulo, entrada);
    camposDaPlanilha.append(grupo);
  }
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
  if (CAMPOS_DA_PLANILHA_DE_TEMPOS.length === 0) {
    return "EM DESENVOLVIMENTO";
  }

  return "";
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
  const erroDosDados = manualAtivo
    ? validarPreenchimentoManual()
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
      entradaManual.focus();
    } else {
      planilhaDeTempos.focus();
    }
  }

  return !(nomeInvalido || fotoInvalida || dadosInvalidos);
}

for (const fonteDeDados of fontesDeDadosDaCorrida) {
  fonteDeDados.addEventListener("change", alternarFonteDeDados);
}

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

