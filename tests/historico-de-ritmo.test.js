import assert from "node:assert/strict";
import test from "node:test";

import {
  adicionarRitmoProjetadoAoHistorico,
  criarConfiguracaoDoHistoricoDeRitmo,
  criarSerieDoRitmoProjetado,
  obterRotuloDoHistorico,
  ordenarCorridasPorData,
} from "../js/historico-de-ritmo.js";

const visualizacaoDoDesignSystem = Object.freeze({
  corAccent: "accent",
  corAccentSoft: "accent-soft",
  corDivider: "divider",
  corSupport: "support",
  corSurface: "surface",
  corTextoPrimario: "texto-primario",
  corTextoSecundario: "texto-secundario",
  espaco1: 4,
  espaco2: 8,
  espaco3: 12,
  fonteCorpo: "fonte-corpo",
  fonteDados: "fonte-dados",
});

const corridasExtraidas = Object.freeze([
  Object.freeze({
    dataDaCorrida: "2026-07-15",
    nomeDaCorrida: "",
    ritmoPaceEmSegundosPorKm: 315,
  }),
  Object.freeze({
    dataDaCorrida: "2026-07-01",
    nomeDaCorrida: "Corrida do Parque",
    ritmoPaceEmSegundosPorKm: 300,
  }),
]);

test("ordena o histórico pela Data da Corrida", () => {
  assert.deepEqual(
    ordenarCorridasPorData(corridasExtraidas).map(
      ({ dataDaCorrida }) => dataDaCorrida,
    ),
    ["2026-07-01", "2026-07-15"],
  );
});

test("usa Nome da Corrida e Data como fallback do rótulo", () => {
  assert.equal(obterRotuloDoHistorico(corridasExtraidas[1]), "Corrida do Parque");
  assert.equal(obterRotuloDoHistorico(corridasExtraidas[0]), "15/07/2026");
});

test("configura a curva e a área inicial do Ritmo Histórico", () => {
  const configuracao = criarConfiguracaoDoHistoricoDeRitmo(
    corridasExtraidas,
    visualizacaoDoDesignSystem,
  );

  assert.equal(configuracao.type, "line");
  assert.deepEqual(configuracao.data.labels, [
    "Corrida do Parque",
    "15/07/2026",
  ]);
  assert.deepEqual(configuracao.data.datasets[0].data, [300, 315]);
  assert.equal(configuracao.data.datasets[0].label, "Ritmo Histórico");
  assert.equal(configuracao.data.datasets[0].fill, "origin");
  assert.equal(configuracao.data.datasets[0].tension, 0.4);
  assert.equal(typeof configuracao.data.datasets[0].backgroundColor, "function");
  assert.equal(configuracao.options.plugins.legend.display, true);
  assert.equal(configuracao.options.scales.x.grid.display, false);
  assert.equal(configuracao.options.scales.y.grid.display, false);
});

test("sobrepõe o Ritmo Projetado ao histórico sem alterar os valores", () => {
  const serie = criarSerieDoRitmoProjetado({
    quantidadeDeRotulos: 2,
    ritmoProjetadoEmSegundosPorKm: 310,
    visualizacaoDoDesignSystem,
  });

  assert.equal(serie.label, "Ritmo Projetado");
  assert.deepEqual(serie.data, [310, 310]);
  assert.equal(serie.fill, "origin");
  assert.equal(serie.tension, 0.4);

  let quantidadeDeAtualizacoes = 0;
  const graficoDoHistorico = {
    data: {
      datasets: [{ label: "Ritmo Histórico", data: [300, 315] }],
      labels: ["Corrida do Parque", "15/07/2026"],
    },
    update() {
      quantidadeDeAtualizacoes += 1;
    },
  };

  adicionarRitmoProjetadoAoHistorico({
    graficoDoHistorico,
    ritmoProjetadoEmSegundosPorKm: 310,
    visualizacaoDoDesignSystem,
  });

  assert.equal(graficoDoHistorico.data.datasets.length, 2);
  assert.deepEqual(graficoDoHistorico.data.datasets[1].data, [310, 310]);
  assert.equal(quantidadeDeAtualizacoes, 1);
});
