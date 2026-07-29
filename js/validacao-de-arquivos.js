export const LIMITE_DE_ARQUIVO_EM_BYTES = 2 * 1024 * 1024;

function validarPresencaETamanho(arquivo, nomeDoArquivo) {
  if (!arquivo) {
    return `Selecione ${nomeDoArquivo}.`;
  }

  if (arquivo.size === 0) {
    return `O arquivo de ${nomeDoArquivo} está vazio.`;
  }

  if (arquivo.size > LIMITE_DE_ARQUIVO_EM_BYTES) {
    return `O arquivo de ${nomeDoArquivo} deve ter no máximo 2 MB.`;
  }

  return "";
}

export function validarFotoDePerfil(arquivo) {
  const erroBasico = validarPresencaETamanho(arquivo, "foto de perfil");

  if (erroBasico) {
    return erroBasico;
  }

  if (!arquivo.type.startsWith("image/")) {
    return "Selecione um arquivo de imagem para a foto de perfil.";
  }

  return "";
}

export function validarPlanilhaDeTempos(arquivo) {
  const erroBasico = validarPresencaETamanho(arquivo, "planilha de tempos");

  if (erroBasico) {
    return erroBasico;
  }

  if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {
    return "Selecione um arquivo de planilha no formato .xlsx.";
  }

  return "";
}

