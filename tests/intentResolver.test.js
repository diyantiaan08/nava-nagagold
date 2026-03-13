import test from "node:test";
import assert from "node:assert/strict";
import { resolveIntent } from "../intent_resolver.js";

test("resolveIntent prioritizes pembelian sales over pembelian umum", () => {
  const result = resolveIntent("siapa sales yang paling banyak melayani pembelian kemarin");
  assert.equal(result.type, "pembelian_sales");
});

test("resolveIntent prioritizes penjualan marketplace over penjualan umum", () => {
  const result = resolveIntent("berapa penjualan marketplace shopee kemarin");
  assert.equal(result.type, "penjualan_marketplace");
});

test("resolveIntent separates cash and non-cash", () => {
  assert.equal(resolveIntent("berapa saldo non-cash hari ini").type, "report_non_cash");
  assert.equal(resolveIntent("berapa total uang non cash saya ditoko pada hari kemarin").type, "report_non_cash");
  assert.equal(resolveIntent("berapa saldo kas hari ini").type, "report_cash");
});

test("resolveIntent separates hutang and hutang lunas", () => {
  assert.equal(resolveIntent("berapa hutang lunas hari ini").type, "hutang_lunas");
  assert.equal(resolveIntent("berapa total hutang hari ini").type, "hutang");
});

test("resolveIntent prioritizes margin over penjualan umum", () => {
  const result = resolveIntent("berapa margin penjualan kemarin");
  assert.equal(result.type, "margin_penjualan");
});

test("resolveIntent maps omzet question to penjualan report", () => {
  const result = resolveIntent("berapa omzet saya kemarin?");
  assert.equal(result.type, "penjualan_report");
  assert.equal(result.matchedFunction?.name, "getPenjualanAnnual");
});

test("resolveIntent maps menjual phrasing to penjualan sales", () => {
  const result = resolveIntent("kalau sales yg paling banyak menjual hari kemarin siapa?");
  assert.equal(result.type, "penjualan_sales");
  assert.equal(result.matchedFunction?.name, "getPenjualanSales");
});
