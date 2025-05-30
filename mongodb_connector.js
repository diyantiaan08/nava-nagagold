
import {MongoClient} from 'mongodb'

export async function getSalesDetails(args) {
  // Ganti dengan URI koneksi MongoDB Anda
const uri = "";
const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db("db_italy_new"); // Ganti dengan nama database Anda
    const salesDetails = database.collection("tt_jual_detail"); // Ganti dengan nama koleksi Anda

    const query = {status_kembali:"OPEN", status_valid:"DONE", tgl_system:args.tgl_system}; // Anda bisa menambahkan kriteria query spesifik di sini jika diperlukan berdasarkan argumen dari Gemini
    const projection = {
      _id: 0, // Exclude the default _id field
      tgl_system: 1,
      no_faktur_jual: 1,
      harga_jual: 1,
      harga_total: 1,
      kode_dept: 1,
    };

    const salesData = await salesDetails.find(query, { projection }).toArray(); // Menggunakan findOne karena kita mencari berdasarkan no_faktur yang unik
    
    return salesData
  } catch (error) {
    console.error("Error saat mengambil data penjualan dari MongoDB:", error);
    return null;
  } finally {
    await client.close();
  }
}