import { formatarRitmoPace } from "./ritmo-pace.js";

const formatadorDaDataDaCorrida = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

export function ordenarCorridasPorData(corridasExtraidas) {
  return [...corridasExtraidas].sort((corridaA, corridaB) =>
    corridaA.dataDaCorrida.localeCompare(corridaB.dataDaCorrida),
  );
}

export function obterRotuloDoHistorico(corrida) {
  if (corrida.nomeDaCorrida) {
    return corrida.nomeDaCorrida;
  }

  return formatadorDaDataDaCorrida.format(
    new Date(`${corrida.dataDaCorrida}T00:00:00Z`),
  );
}

function aplicarOpacidadeNaCor(corEmHexadecimal, opacidade) {
  const hexadecimal = corEmHexadecimal.replace("#", "");

  if (!/^[\da-f]{6}$/i.test(hexadecimal)) {
    return corEmHexadecimal;
  }

  const vermelho = Number.parseInt(hexadecimal.slice(0, 2), 16);
  const verde = Number.parseInt(hexadecimal.slice(2, 4), 16);
  const azul = Number.parseInt(hexadecimal.slice(4, 6), 16);

  return `rgba(${vermelho}, ${verde}, ${azul}, ${opacidade})`;
}

function criarPreenchimentoEmGradiente(corDoDesignSystem) {
  return (contexto) => {
    const { chartArea, ctx } = contexto.chart;
    const corInicial = aplicarOpacidadeNaCor(corDoDesignSystem, 0.36);
    const corFinal = aplicarOpacidadeNaCor(corDoDesignSystem, 0);

    if (!chartArea) {
      return corInicial;
    }

    const gradiente = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );

    gradiente.addColorStop(0, corInicial);
    gradiente.addColorStop(1, corFinal);

    return gradiente;
  };
}

function criarEstiloDaSerie({
  corDaArea,
  corDaLinha,
  visualizacaoDoDesignSystem,
}) {
  return {
    backgroundColor: criarPreenchimentoEmGradiente(corDaArea),
    borderColor: corDaLinha,
    borderWidth: visualizacaoDoDesignSystem.espaco1,
    cubicInterpolationMode: "monotone",
    fill: "origin",
    pointBackgroundColor: visualizacaoDoDesignSystem.corSurface,
    pointBorderColor: corDaLinha,
    pointBorderWidth: visualizacaoDoDesignSystem.espaco1,
    pointHoverRadius: visualizacaoDoDesignSystem.espaco1,
    pointRadius: 0,
    tension: 0.4,
  };
}

export function criarSerieDoRitmoProjetado({
  quantidadeDeRotulos,
  ritmoProjetadoEmSegundosPorKm,
  visualizacaoDoDesignSystem,
}) {
  return {
    ...criarEstiloDaSerie({
      corDaArea: visualizacaoDoDesignSystem.corSupport,
      corDaLinha: visualizacaoDoDesignSystem.corTextoPrimario,
      visualizacaoDoDesignSystem,
    }),
    data: Array.from(
      { length: quantidadeDeRotulos },
      () => ritmoProjetadoEmSegundosPorKm,
    ),
    label: "Ritmo Projetado",
  };
}

export function criarConfiguracaoDoHistoricoDeRitmo(
  corridasExtraidas,
  visualizacaoDoDesignSystem,
) {
  const corridasOrdenadas = ordenarCorridasPorData(corridasExtraidas);

  return {
    type: "line",
    data: {
      labels: corridasOrdenadas.map(obterRotuloDoHistorico),
      datasets: [
        {
          ...criarEstiloDaSerie({
            corDaArea: visualizacaoDoDesignSystem.corAccent,
            corDaLinha: visualizacaoDoDesignSystem.corAccent,
            visualizacaoDoDesignSystem,
          }),
          data: corridasOrdenadas.map(
            ({ ritmoPaceEmSegundosPorKm }) => ritmoPaceEmSegundosPorKm,
          ),
          label: "Ritmo Histórico",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        intersect: false,
        mode: "index",
      },
      layout: {
        padding: visualizacaoDoDesignSystem.espaco2,
      },
      plugins: {
        legend: {
          align: "end",
          display: true,
          labels: {
            boxHeight: visualizacaoDoDesignSystem.espaco1,
            boxWidth: visualizacaoDoDesignSystem.espaco3,
            color: visualizacaoDoDesignSystem.corTextoSecundario,
            font: {
              family: visualizacaoDoDesignSystem.fonteCorpo,
            },
          },
          position: "top",
        },
        tooltip: {
          backgroundColor: visualizacaoDoDesignSystem.corTextoPrimario,
          bodyColor: visualizacaoDoDesignSystem.corSurface,
          borderColor: visualizacaoDoDesignSystem.corDivider,
          callbacks: {
            label(contexto) {
              return `${contexto.dataset.label}: ${formatarRitmoPace(
                contexto.parsed.y,
              )}`;
            },
          },
          titleColor: visualizacaoDoDesignSystem.corSurface,
        },
      },
      scales: {
        x: {
          border: {
            display: false,
          },
          grid: {
            display: false,
          },
          ticks: {
            color: visualizacaoDoDesignSystem.corTextoSecundario,
            font: {
              family: visualizacaoDoDesignSystem.fonteDados,
            },
            padding: visualizacaoDoDesignSystem.espaco2,
          },
        },
        y: {
          border: {
            display: false,
          },
          grid: {
            display: false,
          },
          ticks: {
            color: visualizacaoDoDesignSystem.corTextoSecundario,
            callback(valor) {
              return formatarRitmoPace(Number(valor)).replace(" min/km", "");
            },
            font: {
              family: visualizacaoDoDesignSystem.fonteDados,
            },
            padding: visualizacaoDoDesignSystem.espaco2,
          },
          title: {
            color: visualizacaoDoDesignSystem.corTextoSecundario,
            display: true,
            font: {
              family: visualizacaoDoDesignSystem.fonteCorpo,
            },
            text: "Ritmo (min/km)",
          },
        },
      },
    },
  };
}

export function renderizarHistoricoDeRitmo({
  bibliotecaChart,
  canvasDoHistorico,
  corridasExtraidas,
  visualizacaoDoDesignSystem,
}) {
  if (typeof bibliotecaChart !== "function") {
    throw new Error("Chart.js não está disponível para renderizar o histórico.");
  }

  return new bibliotecaChart(
    canvasDoHistorico,
    criarConfiguracaoDoHistoricoDeRitmo(
      corridasExtraidas,
      visualizacaoDoDesignSystem,
    ),
  );
}

export function adicionarRitmoProjetadoAoHistorico({
  graficoDoHistorico,
  ritmoProjetadoEmSegundosPorKm,
  visualizacaoDoDesignSystem,
}) {
  const serieDoRitmoProjetado = criarSerieDoRitmoProjetado({
    quantidadeDeRotulos: graficoDoHistorico.data.labels.length,
    ritmoProjetadoEmSegundosPorKm,
    visualizacaoDoDesignSystem,
  });
  const indiceDaSerieExistente = graficoDoHistorico.data.datasets.findIndex(
    ({ label }) => label === serieDoRitmoProjetado.label,
  );

  if (indiceDaSerieExistente >= 0) {
    graficoDoHistorico.data.datasets[indiceDaSerieExistente] =
      serieDoRitmoProjetado;
  } else {
    graficoDoHistorico.data.datasets.push(serieDoRitmoProjetado);
  }

  graficoDoHistorico.update();

  return graficoDoHistorico;
}
