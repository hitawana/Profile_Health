import { CAMPOS_DA_PLANILHA_DE_TEMPOS } from "./campos-da-planilha-de-tempos.js";
import {
  validarFotoDePerfil,
  validarPlanilhaDeTempos,
} from "./validacao-de-arquivos.js";

const formulario = document.querySelector("#formulario-perfil-de-analise");
const nomeOuApelido = document.querySelector("#nome-ou-apelido");
const fotoDePerfil = document.querySelector("#foto-de-perfil");
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

function fonteDeDadosSelecionada() {
  return document.querySelector(
    'input[name="fonteDeDadosDaCorrida"]:checked',
  )?.value;
}

function preencherCamposManuais() {
  camposDaPlanilha.replaceChildren();

  if (CAMPOS_DA_PLANILHA_DE_TEMPOS.length === 0) {
    const aviso = document.createElement("p");
    aviso.textContent =
      "Os campos serão disponibilizados quando o template .xlsx definir as colunas da planilha de tempos.";
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
  erroPlanilha.textContent = "";
  erroPreenchimentoManual.textContent = "";
}

function mostrarToast(mensagem, tipo = "status") {
  window.clearTimeout(temporizadorDoToast);

  mensagemToast.textContent = mensagem;
  toast.setAttribute("role", tipo);
  toast.hidden = false;

  temporizadorDoToast = window.setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}

function definirErro(elementoDoErro, mensagem) {
  elementoDoErro.textContent = mensagem;
  return Boolean(mensagem);
}

function validarNomeOuApelido() {
  return nomeOuApelido.value.trim()
    ? ""
    : "Informe seu nome ou apelido.";
}

function validarPreenchimentoManual() {
  if (CAMPOS_DA_PLANILHA_DE_TEMPOS.length === 0) {
    return "O preenchimento manual aguarda a definição das colunas do template .xlsx.";
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

    mostrarToast(
      "Dados de entrada validados. A leitura da planilha será adicionada quando o template estiver disponível.",
    );
  }, 1000);
}

function validarFormulario() {
  const erroDoNome = validarNomeOuApelido();
  const erroDaFoto = validarFotoDePerfil(fotoDePerfil.files[0]);
  const manualAtivo = fonteDeDadosSelecionada() === "preenchimento-manual";
  const erroDosDados = manualAtivo
    ? validarPreenchimentoManual()
    : validarPlanilhaDeTempos(planilhaDeTempos.files[0]);

  const nomeInvalido = definirErro(erroNome, erroDoNome);
  const fotoInvalida = definirErro(erroFoto, erroDaFoto);
  const dadosInvalidos = manualAtivo
    ? definirErro(erroPreenchimentoManual, erroDosDados)
    : definirErro(erroPlanilha, erroDosDados);

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
  definirErro(erroFoto, validarFotoDePerfil(fotoDePerfil.files[0]));
});

planilhaDeTempos.addEventListener("change", () => {
  definirErro(
    erroPlanilha,
    validarPlanilhaDeTempos(planilhaDeTempos.files[0]),
  );
});

nomeOuApelido.addEventListener("input", () => {
  if (nomeOuApelido.value.trim()) {
    erroNome.textContent = "";
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

