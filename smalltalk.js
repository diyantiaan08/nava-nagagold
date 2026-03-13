function normalizeText(text = "") {
  return String(text || "").toLowerCase().trim();
}

const GREETING_REGEX = /\b(hai|halo|hallo|hello|selamat pagi|selamat siang|selamat sore|selamat malam)\b/i;
const THANKS_REGEX = /\b(makasih|terima kasih|terimakasih|thanks|thank you|makasih ya|terima kasih ya)\b/i;
const BYE_REGEX = /\b(bye|dadah|sampai jumpa|selamat tinggal)\b/i;

export function getSmalltalkResponse(question = "") {
  const text = normalizeText(question);
  if (!text) return null;

  if (THANKS_REGEX.test(text)) {
    return "Sama-sama. Kalau Anda perlu cek data penjualan, pembelian, stok, hutang, atau laporan lainnya, saya siap membantu.";
  }

  if (GREETING_REGEX.test(text)) {
    return "Halo, saya asisten virtual yang membantu Anda membaca data pada program toko emas Anda. Silakan tanyakan data yang ingin Anda cek.";
  }

  if (BYE_REGEX.test(text)) {
    return "Baik, sampai jumpa. Kalau nanti Anda ingin cek data lagi, saya siap membantu.";
  }

  return null;
}
