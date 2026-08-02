export function calcularRitmoPace(
  tempoTotalEmSegundos,
  distanciaDaCorridaKm,
) {
  if (!Number.isFinite(tempoTotalEmSegundos) || tempoTotalEmSegundos <= 0) {
    throw new RangeError("O tempo total da corrida deve ser maior que zero.");
  }

  if (!Number.isFinite(distanciaDaCorridaKm) || distanciaDaCorridaKm <= 0) {
    throw new RangeError("A distância da corrida deve ser maior que zero.");
  }

  return tempoTotalEmSegundos / distanciaDaCorridaKm;
}

export function formatarRitmoPace(ritmoPaceEmSegundosPorKm) {
  if (
    !Number.isFinite(ritmoPaceEmSegundosPorKm) ||
    ritmoPaceEmSegundosPorKm < 0
  ) {
    return "—";
  }

  const ritmoPaceArredondado = Math.round(ritmoPaceEmSegundosPorKm);
  const minutos = Math.floor(ritmoPaceArredondado / 60);
  const segundos = ritmoPaceArredondado % 60;

  return `${minutos}:${String(segundos).padStart(2, "0")} min/km`;
}
