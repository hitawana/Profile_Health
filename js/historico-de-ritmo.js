import { formatarRitmoPace } from "./ritmo-pace.js";

const formatadorDaDataDaCorrida = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

export const ROTULO_SEU_RITMO = "Seu ritmo";
export const ROTULO_SUA_META = "Sua meta";

export function ordenarCorridasPorData(corridasExtraidas) {
  return [...corridasExtraidas].sort((corridaA, corridaB) =>
    corridaA.dataDaCorrida.localeCompare(corridaB.dataDaCorrida),
  );
}

export function obterRotuloDoHistorico(corrida) {
  return formatadorDaDataDaCorrida.format(
    new Date(`${corrida.dataDaCorrida}T00:00:00Z`),
  );
}

export function obterTituloDoTooltipDoHistorico(corrida) {
  const dataFormatada = obterRotuloDoHistorico(corrida);

  return corrida.nomeDaCorrida
    ? `${corrida.nomeDaCorrida} · ${dataFormatada}`
    : dataFormatada;
}

export function obterIndiceDoPrimeiroCrossover(ritmos, metas) {
  return ritmos.findIndex((ritmo, indice) => {
    const meta = metas[indice];

    return Number.isFinite(ritmo) && Number.isFinite(meta) && ritmo <= meta;
  });
}

function interpolarCoordenada(inicial, final, proporcao) {
  return inicial + (final - inicial) * proporcao;
}

export function calcularPontoInterpoladoDoCrossover({
  metas,
  pontosDasMetas,
  pontosDosRitmos,
  ritmos,
}) {
  for (let indice = 1; indice < ritmos.length; indice += 1) {
    const indiceAnterior = indice - 1;
    const ritmoAnterior = ritmos[indiceAnterior];
    const ritmoAtual = ritmos[indice];
    const metaAnterior = metas[indiceAnterior];
    const metaAtual = metas[indice];
    const pontoDoRitmoAnterior = pontosDosRitmos[indiceAnterior];
    const pontoDoRitmoAtual = pontosDosRitmos[indice];
    const pontoDaMetaAnterior = pontosDasMetas[indiceAnterior];
    const pontoDaMetaAtual = pontosDasMetas[indice];
    const valores = [ritmoAnterior, ritmoAtual, metaAnterior, metaAtual];
    const pontos = [
      pontoDoRitmoAnterior,
      pontoDoRitmoAtual,
      pontoDaMetaAnterior,
      pontoDaMetaAtual,
    ];

    if (
      valores.some((valor) => !Number.isFinite(valor)) ||
      pontos.some(
        (ponto) =>
          !ponto ||
          !Number.isFinite(ponto.x) ||
          !Number.isFinite(ponto.y),
      )
    ) {
      continue;
    }

    const diferencaAnterior = ritmoAnterior - metaAnterior;
    const diferencaAtual = ritmoAtual - metaAtual;
    const cruzouAbaixoDaMeta =
      diferencaAnterior >= 0 && diferencaAtual <= 0;

    if (!cruzouAbaixoDaMeta) {
      continue;
    }

    const variacaoDaDiferenca = diferencaAnterior - diferencaAtual;
    const proporcao =
      variacaoDaDiferenca === 0
        ? 0
        : diferencaAnterior / variacaoDaDiferenca;
    const xDoRitmo = interpolarCoordenada(
      pontoDoRitmoAnterior.x,
      pontoDoRitmoAtual.x,
      proporcao,
    );
    const yDoRitmo = interpolarCoordenada(
      pontoDoRitmoAnterior.y,
      pontoDoRitmoAtual.y,
      proporcao,
    );
    const xDaMeta = interpolarCoordenada(
      pontoDaMetaAnterior.x,
      pontoDaMetaAtual.x,
      proporcao,
    );
    const yDaMeta = interpolarCoordenada(
      pontoDaMetaAnterior.y,
      pontoDaMetaAtual.y,
      proporcao,
    );

    return Object.freeze({
      indiceAtual: indice,
      indiceAnterior,
      proporcao,
      x: (xDoRitmo + xDaMeta) / 2,
      y: (yDoRitmo + yDaMeta) / 2,
    });
  }

  return null;
}

function preencherPoligono(ctx, pontos) {
  ctx.beginPath();
  ctx.moveTo(pontos[0].x, pontos[0].y);

  for (const ponto of pontos.slice(1)) {
    ctx.lineTo(ponto.x, ponto.y);
  }

  ctx.closePath();
  ctx.fill();
}

export const areaEntreRitmoEMetaPlugin = Object.freeze({
  id: "areaEntreRitmoEMetaPlugin",
  beforeDatasetsDraw(grafico, _argumentos, opcoes) {
    const indiceDoSeuRitmo = grafico.data.datasets.findIndex(
      ({ label }) => label === ROTULO_SEU_RITMO,
    );
    const indiceDaSuaMeta = grafico.data.datasets.findIndex(
      ({ label }) => label === ROTULO_SUA_META,
    );

    if (indiceDoSeuRitmo < 0 || indiceDaSuaMeta < 0) {
      return;
    }

    const pontosDoSeuRitmo =
      grafico.getDatasetMeta(indiceDoSeuRitmo).data;
    const pontosDaSuaMeta = grafico.getDatasetMeta(indiceDaSuaMeta).data;

    if (pontosDoSeuRitmo.length < 2 || pontosDaSuaMeta.length < 2) {
      return;
    }

    const { ctx } = grafico;

    ctx.save();
    ctx.fillStyle = opcoes.corDaArea;

    for (let indice = 0; indice < pontosDoSeuRitmo.length - 1; indice += 1) {
      const ritmoInicial = pontosDoSeuRitmo[indice];
      const ritmoFinal = pontosDoSeuRitmo[indice + 1];
      const metaInicial = pontosDaSuaMeta[indice];
      const metaFinal = pontosDaSuaMeta[indice + 1];
      const pontos = [ritmoInicial, ritmoFinal, metaFinal, metaInicial];

      if (
        pontos.some(
          ({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y),
        )
      ) {
        continue;
      }

      const diferencaInicial = ritmoInicial.y - metaInicial.y;
      const diferencaFinal = ritmoFinal.y - metaFinal.y;
      const haCruzamento = diferencaInicial * diferencaFinal < 0;

      if (!haCruzamento) {
        preencherPoligono(ctx, pontos);
        continue;
      }

      const proporcaoDoCruzamento =
        Math.abs(diferencaInicial) /
        (Math.abs(diferencaInicial) + Math.abs(diferencaFinal));
      const pontoDoCruzamento = {
        x:
          ritmoInicial.x +
          (ritmoFinal.x - ritmoInicial.x) * proporcaoDoCruzamento,
        y:
          ritmoInicial.y +
          (ritmoFinal.y - ritmoInicial.y) * proporcaoDoCruzamento,
      };

      preencherPoligono(ctx, [
        ritmoInicial,
        pontoDoCruzamento,
        metaInicial,
      ]);
      preencherPoligono(ctx, [
        pontoDoCruzamento,
        ritmoFinal,
        metaFinal,
      ]);
    }

    ctx.restore();
  },
});

export const crossoverPlugin = Object.freeze({
  id: "crossoverPlugin",
  afterDatasetsDraw(grafico, _argumentos, opcoes) {
    const indiceDoSeuRitmo = grafico.data.datasets.findIndex(
      ({ label }) => label === ROTULO_SEU_RITMO,
    );
    const indiceDaSuaMeta = grafico.data.datasets.findIndex(
      ({ label }) => label === ROTULO_SUA_META,
    );

    if (indiceDoSeuRitmo < 0 || indiceDaSuaMeta < 0) {
      return;
    }

    const metadadosDoSeuRitmo = grafico.getDatasetMeta(indiceDoSeuRitmo);
    const metadadosDaSuaMeta = grafico.getDatasetMeta(indiceDaSuaMeta);
    const pontoDoCrossover = calcularPontoInterpoladoDoCrossover({
      metas: grafico.data.datasets[indiceDaSuaMeta].data,
      pontosDasMetas: metadadosDaSuaMeta.data,
      pontosDosRitmos: metadadosDoSeuRitmo.data,
      ritmos: grafico.data.datasets[indiceDoSeuRitmo].data,
    });

    if (!pontoDoCrossover || !grafico.chartArea) {
      return;
    }

    const { chartArea, ctx } = grafico;
    const pontoFicaNaMetadeDireita =
      pontoDoCrossover.x > (chartArea.left + chartArea.right) / 2;
    const textoCabeAcima =
      pontoDoCrossover.y - opcoes.espacamentoDoTexto >=
      chartArea.top + opcoes.tamanhoDaFonte;
    const textoX =
      pontoDoCrossover.x +
      (pontoFicaNaMetadeDireita
        ? -opcoes.espacamentoDoTexto
        : opcoes.espacamentoDoTexto);
    const textoY =
      pontoDoCrossover.y +
      (textoCabeAcima
        ? -opcoes.espacamentoDoTexto
        : opcoes.espacamentoDoTexto);

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      pontoDoCrossover.x,
      pontoDoCrossover.y,
      opcoes.raioDoDestaque,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = opcoes.corDeFundo;
    ctx.fill();
    ctx.lineWidth = opcoes.espessuraDoDestaque;
    ctx.strokeStyle = opcoes.corDeDestaque;
    ctx.stroke();
    ctx.fillStyle = opcoes.corDoTexto;
    ctx.font = `700 ${opcoes.tamanhoDaFonte}px ${opcoes.fonteDoTexto}`;
    ctx.textAlign = pontoFicaNaMetadeDireita ? "right" : "left";
    ctx.textBaseline = textoCabeAcima ? "bottom" : "top";
    ctx.fillText(opcoes.texto, textoX, textoY);
    ctx.restore();
  },
});

function criarEstiloDaSerie({
  corDaArea,
  corDaLinha,
  visualizacaoDoDesignSystem,
}) {
  return {
    backgroundColor: corDaArea,
    borderColor: corDaLinha,
    borderWidth: visualizacaoDoDesignSystem.espaco1,
    cubicInterpolationMode: "monotone",
    fill: false,
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
      corDaLinha: visualizacaoDoDesignSystem.corDivider,
      visualizacaoDoDesignSystem,
    }),
    borderDash: [
      visualizacaoDoDesignSystem.espaco2,
      visualizacaoDoDesignSystem.espaco2,
    ],
    data: Array.from(
      { length: quantidadeDeRotulos },
      () => ritmoProjetadoEmSegundosPorKm,
    ),
    label: ROTULO_SUA_META,
  };
}

export function criarConfiguracaoDoHistoricoDeRitmo(
  corridasExtraidas,
  visualizacaoDoDesignSystem,
) {
  const corridasOrdenadas = ordenarCorridasPorData(corridasExtraidas);

  return {
    plugins: [areaEntreRitmoEMetaPlugin, crossoverPlugin],
    type: "line",
    data: {
      labels: corridasOrdenadas.map(obterRotuloDoHistorico),
      datasets: [
        {
          ...criarEstiloDaSerie({
            corDaArea: visualizacaoDoDesignSystem.corAccentSoft,
            corDaLinha: visualizacaoDoDesignSystem.corAccent,
            visualizacaoDoDesignSystem,
          }),
          data: corridasOrdenadas.map(
            ({ ritmoPaceEmSegundosPorKm }) => ritmoPaceEmSegundosPorKm,
          ),
          label: ROTULO_SEU_RITMO,
          pointBackgroundColor: visualizacaoDoDesignSystem.corAccent,
          pointBorderColor: visualizacaoDoDesignSystem.corSurface,
          pointHoverRadius: visualizacaoDoDesignSystem.espaco2,
          pointRadius(contexto) {
            return contexto.dataIndex === contexto.dataset.data.length - 1
              ? visualizacaoDoDesignSystem.espaco2
              : 0;
          },
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
        areaEntreRitmoEMetaPlugin: {
          corDaArea: visualizacaoDoDesignSystem.corAccentSoft,
        },
        crossoverPlugin: {
          corDeDestaque: visualizacaoDoDesignSystem.corAccent,
          corDeFundo: visualizacaoDoDesignSystem.corSurface,
          corDoTexto: visualizacaoDoDesignSystem.corTextoPrimario,
          espacamentoDoTexto: visualizacaoDoDesignSystem.espaco5,
          espessuraDoDestaque: visualizacaoDoDesignSystem.espaco1,
          fonteDoTexto: visualizacaoDoDesignSystem.fonteCorpo,
          raioDoDestaque: visualizacaoDoDesignSystem.espaco2,
          tamanhoDaFonte: visualizacaoDoDesignSystem.espaco3,
          texto: "Aqui você bateu sua meta",
        },
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
            title(contextos) {
              const indiceDaCorrida = contextos[0]?.dataIndex;
              const corrida = corridasOrdenadas[indiceDaCorrida];

              return corrida
                ? obterTituloDoTooltipDoHistorico(corrida)
                : "";
            },
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
            text: ["Ritmo (min/km)", "menor = mais rápido"],
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

  const indiceDoSeuRitmo = graficoDoHistorico.data.datasets.findIndex(
    ({ label }) => label === ROTULO_SEU_RITMO,
  );
  const indiceDaSuaMeta = graficoDoHistorico.data.datasets.findIndex(
    ({ label }) => label === ROTULO_SUA_META,
  );

  if (indiceDoSeuRitmo >= 0 && indiceDaSuaMeta >= 0) {
    const serieDoSeuRitmo =
      graficoDoHistorico.data.datasets[indiceDoSeuRitmo];

    serieDoSeuRitmo.backgroundColor =
      visualizacaoDoDesignSystem.corAccentSoft;
    serieDoSeuRitmo.fill = false;
  }

  graficoDoHistorico.update();

  return graficoDoHistorico;
}
