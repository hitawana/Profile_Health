import assert from "node:assert/strict";
import test from "node:test";

import {
  ROTULO_SEU_RITMO,
  ROTULO_SUA_META,
  adicionarRitmoProjetadoAoHistorico,
  areaEntreRitmoEMetaPlugin,
  calcularPontoInterpoladoDoCrossover,
  crossoverPlugin,
  criarConfiguracaoDoHistoricoDeRitmo,
  criarSerieDoRitmoProjetado,
  obterIndiceDoPrimeiroCrossover,
  obterRotuloDoHistorico,
  obterTituloDoTooltipDoHistorico,
  ordenarCorridasPorData,
} from "../js/historico-de-ritmo.js";

const TOLERANCIA_DE_PIXEL = 1e-9;

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
  espaco5: 24,
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

test("usa sempre a Data da Corrida como rótulo do eixo X", () => {
  assert.equal(obterRotuloDoHistorico(corridasExtraidas[1]), "01/07/2026");
  assert.equal(obterRotuloDoHistorico(corridasExtraidas[0]), "15/07/2026");
});

test("reserva o Nome da Corrida opcional para o tooltip", () => {
  assert.equal(
    obterTituloDoTooltipDoHistorico(corridasExtraidas[1]),
    "Corrida do Parque · 01/07/2026",
  );
  assert.equal(
    obterTituloDoTooltipDoHistorico(corridasExtraidas[0]),
    "15/07/2026",
  );
});

test("configura a curva e a área inicial do Ritmo Histórico", () => {
  const configuracao = criarConfiguracaoDoHistoricoDeRitmo(
    corridasExtraidas,
    visualizacaoDoDesignSystem,
  );

  assert.equal(configuracao.type, "line");
  assert.deepEqual(configuracao.data.labels, [
    "01/07/2026",
    "15/07/2026",
  ]);
  assert.equal(
    configuracao.options.plugins.tooltip.callbacks.title([
      { dataIndex: 0 },
    ]),
    "Corrida do Parque · 01/07/2026",
  );
  assert.deepEqual(configuracao.data.datasets[0].data, [300, 315]);
  assert.equal(configuracao.data.datasets[0].label, ROTULO_SEU_RITMO);
  assert.equal(configuracao.data.datasets[0].fill, false);
  assert.equal(
    configuracao.data.datasets[0].backgroundColor,
    visualizacaoDoDesignSystem.corAccentSoft,
  );
  assert.equal(configuracao.data.datasets[0].tension, 0.4);
  assert.equal(
    configuracao.data.datasets[0].pointBackgroundColor,
    visualizacaoDoDesignSystem.corAccent,
  );
  assert.equal(
    configuracao.data.datasets[0].pointRadius({
      dataIndex: 0,
      dataset: configuracao.data.datasets[0],
    }),
    0,
  );
  assert.equal(
    configuracao.data.datasets[0].pointRadius({
      dataIndex: 1,
      dataset: configuracao.data.datasets[0],
    }),
    visualizacaoDoDesignSystem.espaco2,
  );
  assert.deepEqual(configuracao.plugins, [
    areaEntreRitmoEMetaPlugin,
    crossoverPlugin,
  ]);
  assert.equal(configuracao.options.plugins.legend.display, true);
  assert.deepEqual(configuracao.options.scales.y.title.text, [
    "Ritmo (min/km)",
    "menor = mais rápido",
  ]);
  assert.equal(configuracao.options.scales.x.grid.display, false);
  assert.equal(configuracao.options.scales.y.grid.display, false);
});

test("localiza o primeiro ponto em que o atleta bate a meta", () => {
  assert.equal(
    obterIndiceDoPrimeiroCrossover([320, 310, 295], [300, 300, 300]),
    2,
  );
  assert.equal(
    obterIndiceDoPrimeiroCrossover([320, 310, 305], [300, 300, 300]),
    -1,
  );
});

test("interpola o pixel exato do cruzamento entre dois registros", () => {
  const ponto = calcularPontoInterpoladoDoCrossover({
    metas: [320, 320],
    pontosDasMetas: [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
    pontosDosRitmos: [
      { x: 0, y: 10 },
      { x: 100, y: 70 },
    ],
    ritmos: [360, 300],
  });

  assert.equal(ponto.indiceAnterior, 0);
  assert.equal(ponto.indiceAtual, 1);
  assert.ok(Math.abs(ponto.proporcao - 2 / 3) < TOLERANCIA_DE_PIXEL);
  assert.ok(Math.abs(ponto.x - 200 / 3) < TOLERANCIA_DE_PIXEL);
  assert.equal(ponto.y, 50);
});

test("preenche os dois lados da área quando as linhas se cruzam", () => {
  let quantidadeDePreenchimentos = 0;
  const contexto = {
    beginPath() {},
    closePath() {},
    fill() {
      quantidadeDePreenchimentos += 1;
    },
    lineTo() {},
    moveTo() {},
    restore() {},
    save() {},
  };
  const metadados = [
    { data: [{ x: 0, y: 10 }, { x: 100, y: 90 }] },
    { data: [{ x: 0, y: 50 }, { x: 100, y: 50 }] },
  ];
  const grafico = {
    ctx: contexto,
    data: {
      datasets: [
        { data: [360, 300], label: ROTULO_SEU_RITMO },
        { data: [320, 320], label: ROTULO_SUA_META },
      ],
    },
    getDatasetMeta(indice) {
      return metadados[indice];
    },
  };

  areaEntreRitmoEMetaPlugin.beforeDatasetsDraw(grafico, {}, {
    corDaArea: visualizacaoDoDesignSystem.corAccentSoft,
  });

  assert.equal(quantidadeDePreenchimentos, 2);
  assert.equal(
    contexto.fillStyle,
    visualizacaoDoDesignSystem.corAccentSoft,
  );
});

test("crossoverPlugin desenha a conquista no primeiro cruzamento", () => {
  const chamadas = [];
  const contexto = {
    arc(...argumentos) {
      chamadas.push(["arc", ...argumentos]);
    },
    beginPath() {},
    fill() {},
    fillText(...argumentos) {
      chamadas.push(["fillText", ...argumentos]);
    },
    restore() {},
    save() {},
    stroke() {},
  };
  const opcoes =
    criarConfiguracaoDoHistoricoDeRitmo(
      corridasExtraidas,
      visualizacaoDoDesignSystem,
    ).options.plugins.crossoverPlugin;
  const grafico = {
    chartArea: { bottom: 100, left: 0, right: 100, top: 0 },
    ctx: contexto,
    data: {
      datasets: [
        { data: [360, 300], label: ROTULO_SEU_RITMO },
        { data: [320, 320], label: ROTULO_SUA_META },
      ],
    },
    getDatasetMeta(indice) {
      return [
        {
          data: [
            { x: 0, y: 10 },
            { x: 100, y: 70 },
          ],
        },
        {
          data: [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
        },
      ][indice];
    },
  };

  crossoverPlugin.afterDatasetsDraw(grafico, {}, opcoes);

  const [, xDoDestaque, yDoDestaque, raio] = chamadas[0];
  const [, texto, xDoTexto, yDoTexto] = chamadas[1];

  assert.ok(Math.abs(xDoDestaque - 200 / 3) < TOLERANCIA_DE_PIXEL);
  assert.equal(yDoDestaque, 50);
  assert.equal(raio, 8);
  assert.notEqual(xDoDestaque, 100);
  assert.equal(texto, "Aqui você bateu sua meta");
  assert.ok(Math.abs(xDoTexto - 128 / 3) < TOLERANCIA_DE_PIXEL);
  assert.equal(yDoTexto, 26);
});

test("sobrepõe o Ritmo Projetado ao histórico sem alterar os valores", () => {
  const serie = criarSerieDoRitmoProjetado({
    quantidadeDeRotulos: 2,
    ritmoProjetadoEmSegundosPorKm: 310,
    visualizacaoDoDesignSystem,
  });

  assert.equal(serie.label, ROTULO_SUA_META);
  assert.deepEqual(serie.data, [310, 310]);
  assert.equal(serie.fill, false);
  assert.equal(serie.borderColor, visualizacaoDoDesignSystem.corDivider);
  assert.deepEqual(serie.borderDash, [8, 8]);
  assert.equal(serie.tension, 0.4);

  let quantidadeDeAtualizacoes = 0;
  const graficoDoHistorico = {
    data: {
      datasets: [{ label: ROTULO_SEU_RITMO, data: [300, 315] }],
      labels: ["01/07/2026", "15/07/2026"],
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
  assert.equal(
    graficoDoHistorico.data.datasets[1].label,
    ROTULO_SUA_META,
  );
  assert.equal(graficoDoHistorico.data.datasets[0].fill, false);
  assert.equal(
    graficoDoHistorico.data.datasets[0].backgroundColor,
    visualizacaoDoDesignSystem.corAccentSoft,
  );
  assert.equal(quantidadeDeAtualizacoes, 1);
});
