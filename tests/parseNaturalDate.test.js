import test from "node:test";
import assert from "node:assert/strict";
import dayjs from "dayjs";
import { parseDatePhrase } from "../parseNaturalDate.js";

test("parseDatePhrase handles relative dates", () => {
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const today = dayjs().format("YYYY-MM-DD");
  const lastWeekStart = dayjs()
    .subtract(((dayjs().day() + 6) % 7) + 7, "day")
    .format("YYYY-MM-DD");

  assert.deepEqual(parseDatePhrase("berapa penjualan kemarin"), {
    tgl_awal: yesterday,
    tgl_akhir: yesterday,
  });
  assert.deepEqual(parseDatePhrase("stok hari ini"), {
    tgl_awal: today,
    tgl_akhir: today,
  });
  assert.equal(parseDatePhrase("laporan minggu lalu").tgl_awal, lastWeekStart);
});

test("parseDatePhrase handles Indonesian explicit dates and ranges", () => {
  assert.deepEqual(parseDatePhrase("5 maret 2026"), {
    tgl_awal: "2026-03-05",
    tgl_akhir: "2026-03-05",
  });
  assert.deepEqual(parseDatePhrase("5 sampai 7 maret 2026"), {
    tgl_awal: "2026-03-05",
    tgl_akhir: "2026-03-07",
  });
});

test("parseDatePhrase handles month-only references", () => {
  assert.deepEqual(parseDatePhrase("bulan februari"), {
    tgl_awal: "2026-02-01",
    tgl_akhir: "2026-02-28",
  });
  assert.deepEqual(parseDatePhrase("bulan februari 2026"), {
    tgl_awal: "2026-02-01",
    tgl_akhir: "2026-02-28",
  });
});

test("parseDatePhrase handles year-only references", () => {
  assert.deepEqual(parseDatePhrase("tahun 2025"), {
    tgl_awal: "2025-01-01",
    tgl_akhir: "2025-12-31",
  });
});
