import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPOS_DA_META_DA_PROXIMA_CORRIDA,
  criarMetaDaProximaCorrida,
  validarValorDoCampoDaMetaDaProximaCorrida,
} from "../js/meta-da-proxima-corrida.js";

const camposPorChave = new Map(
  CAMPOS_DA_META_DA_PROXIMA_CORRIDA.map((campo) => [campo.chave, campo]),
);

test("preserva os cinco Campos da Meta na linguagem definida", () => {
  assert.deepEqual(
    CAMPOS_DA_META_DA_PROXIMA_CORRIDA.map(({ nome }) => nome),
    [
      "Nome da Corrida",
      "Local",
      "Data",
      "Horário da Largada",
      "Distância (km)",
    ],
  );
});

test("mantém somente Distância (km) como Campo da Meta obrigatório", () => {
  assert.deepEqual(
    CAMPOS_DA_META_DA_PROXIMA_CORRIDA.filter(
      ({ obrigatorio }) => obrigatorio,
    ).map(({ nome }) => nome),
    ["Distância (km)"],
  );

  for (const campo of CAMPOS_DA_META_DA_PROXIMA_CORRIDA) {
    const mensagem = validarValorDoCampoDaMetaDaProximaCorrida(campo, "");

    if (campo.nome === "Distância (km)") {
      assert.notEqual(mensagem, "");
    } else {
      assert.equal(mensagem, "");
    }
  }
});

test("valida Data, Horário da Largada e Distância da Meta", () => {
  assert.equal(
    validarValorDoCampoDaMetaDaProximaCorrida(
      camposPorChave.get("data"),
      "2026-08-02",
    ),
    "",
  );
  assert.equal(
    validarValorDoCampoDaMetaDaProximaCorrida(
      camposPorChave.get("horarioDaLargada"),
      "05:30",
    ),
    "",
  );
  assert.equal(
    validarValorDoCampoDaMetaDaProximaCorrida(
      camposPorChave.get("distanciaKm"),
      "5",
    ),
    "",
  );
  assert.notEqual(
    validarValorDoCampoDaMetaDaProximaCorrida(
      camposPorChave.get("horarioDaLargada"),
      "25:00",
    ),
    "",
  );
  assert.notEqual(
    validarValorDoCampoDaMetaDaProximaCorrida(
      camposPorChave.get("distanciaKm"),
      "0",
    ),
    "",
  );
});

test("cria a Meta da Próxima Corrida com a Distância numérica", () => {
  assert.deepEqual(
    criarMetaDaProximaCorrida({
      data: "2026-08-02",
      distanciaKm: "5",
      horarioDaLargada: "05:30",
      local:
        "Em frente à Igreja Matriz / Praça Padre André, Alto Alegre do Pindaré - MA",
      nomeDaCorrida: "Corrida da Matriz",
    }),
    {
      data: "2026-08-02",
      distanciaKm: 5,
      horarioDaLargada: "05:30",
      local:
        "Em frente à Igreja Matriz / Praça Padre André, Alto Alegre do Pindaré - MA",
      nomeDaCorrida: "Corrida da Matriz",
    },
  );
});

test("cria a Meta apenas com a Distância e preserva os opcionais vazios", () => {
  assert.deepEqual(
    criarMetaDaProximaCorrida({
      data: "",
      distanciaKm: "5",
      horarioDaLargada: "",
      local: "",
      nomeDaCorrida: "",
    }),
    {
      data: "",
      distanciaKm: 5,
      horarioDaLargada: "",
      local: "",
      nomeDaCorrida: "",
    },
  );
});
