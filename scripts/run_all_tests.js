import 'dotenv/config';
import dayjs from 'dayjs';
import * as funcs from '../function.js';

async function run() {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  console.log('1) getItem - stock yesterday:', yesterday);
  try {
    const r1 = await funcs.getItem({ tanggal: yesterday });
    console.log('   -> total_stock:', r1.total_stock, 'total_berat:', r1.total_berat);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('2) getHutang - total hutang on 2026-03-05');
  try {
    const r2 = await funcs.getHutang({ tgl_awal: '2026-03-05', tgl_akhir: '2026-03-05' });
    console.log('   -> total_jumlah:', r2.total_jumlah, 'total_berat:', r2.total_berat, 'total_hutang:', r2.total_hutang);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('3) getHutangLunas - total hutang lunas on 2026-03-02');
  try {
    const r3 = await funcs.getHutangLunas({ tgl_awal: '2026-03-02', tgl_akhir: '2026-03-02' });
    console.log('   -> total_jumlah:', r3.total_jumlah, 'total_hutang_lunas:', r3.total_hutang_lunas, 'total_bunga_lunas:', r3.total_bunga_lunas);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('4) getMarginPenjualan - total margin yesterday');
  try {
    const r4 = await funcs.getMarginPenjualan({ tgl_awal: yesterday, tgl_akhir: yesterday });
    console.log('   -> total_margin:', r4.total_margin, 'total_penjualan:', r4.total_penjualan);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('5) Berapa total pembelian saya kemarin?');
  try {
    const r5 = await funcs.getPembelian({ tgl_awal: yesterday, tgl_akhir: yesterday });
    console.log('   -> total_count:', r5.total_count, 'total_berat:', r5.total_berat, 'total_rupiah:', r5.total_rupiah);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('6) getPembelianSales - top sales yesterday (by qty)');
  try {
    const r6 = await funcs.getPembelianSales({ tgl_awal: yesterday, tgl_akhir: yesterday, sortBy: 'qty' });
    const top = (r6.aggregate && r6.aggregate[0]) || null;
    console.log('   -> top:', top);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('7) getPenjualanMarketplace - total on 2026-03-02');
  try {
    const r7 = await funcs.getPenjualanMarketplace({ tgl_from: '2026-03-02', tgl_to: '2026-03-02' });
    console.log('   -> total_qty:', r7.total_qty, 'total_rupiah:', r7.total_rupiah);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('8) getPenjualanSales - top sales yesterday');
  try {
    const r8 = await funcs.getPenjualanSales({ tgl_awal: yesterday, tgl_akhir: yesterday });
    const top8 = (r8.aggregate && r8.aggregate[0]) || null;
    console.log('   -> top:', top8);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('9) getPenjualanAnnual - totals yesterday');
  try {
    const r9 = await funcs.getPenjualanAnnual({ tgl_awal: yesterday, tgl_akhir: yesterday, useSSE: true, token: process.env.TKM_TOKEN || '' });
    console.log('   -> total_qty:', r9.total_qty, 'total_rupiah:', r9.total_rupiah);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('10) getReportCash - saldo akhir yesterday');
  try {
    const r10 = await funcs.getReportCash({ tgl_from: yesterday, tgl_to: yesterday, user_login: process.env.USER_LOGIN || 'devops.nagatech' });
    console.log('   -> total_in:', r10.total_in, 'total_out:', r10.total_out, 'saldo_akhir:', r10.saldo_akhir);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('11) getReportNonCash - saldo akhir yesterday (SSE)');
  try {
    const r11 = await funcs.getReportNonCash({ tgl_from: yesterday, tgl_to: yesterday, useSSE: true });
    console.log('   -> total_in:', r11.total_in, 'total_out:', r11.total_out, 'saldo_akhir:', r11.saldo_akhir);
  } catch (e) { console.error('   ERROR', e.message || e); }

  console.log('12) getService - total transaksi service on 2026-03-09');
  try {
    const r12 = await funcs.getService({ tgl_awal: '2026-03-09', tgl_akhir: '2026-03-09' });
    console.log('   -> total_qty:', r12.total_qty, 'total_berat:', r12.total_berat, 'total_rp:', r12.total_rp);
  } catch (e) { console.error('   ERROR', e.message || e); }
}

run().catch((e) => { console.error('Fatal error', e); process.exit(1); });
