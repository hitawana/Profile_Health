import assert from "node:assert/strict";
import test from "node:test";

import {
  calcularRitmoPace,
  formatarRitmoPace,
} from "../js/ritmo-pace.js";

test("calcula o Ritmo (Pace) exato em segundos por quilômetro", () => {
  assert.equal(calcularRitmoPace(1500, 5), 300);
  assert.equal(calcularRitmoPace(2430, 7.5), 324);
});

test("rejeita tempo ou distância que impeçam o cálculo do Ritmo", () => {
  assert.throws(() => calcularRitmoPace(0, 5), /tempo total/);
  assert.throws(() => calcularRitmoPace(1500, 0), /distância/);
});

test("formata o Ritmo (Pace) para exibição", () => {
  assert.equal(formatarRitmoPace(300), "5:00 min/km");
  assert.equal(formatarRitmoPace(324.4), "5:24 min/km");
});
