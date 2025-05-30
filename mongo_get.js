import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URL; // Ganti dengan URI MongoDB kamu
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("db_italy_new"); // Ganti dengan nama DB kamu
  }
  return db;
}

export async function getCollectionData(collectionName, query = {}, projection = {}) {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    const data = await collection.find(query, { projection }).toArray();
    return data;
  } catch (error) {
    console.error(`Gagal mengambil data dari koleksi ${collectionName}:`, error);
    return null;
  }
}

export async function aggregateData(collectionName, aggregate = {}) {
  try {
    const db = await connectDB();
    const collection = db.collection(collectionName);
    const data = await collection.aggregate(aggregate).toArray();
    return data;
  } catch (error) {
    console.error(`Gagal mengambil data dari koleksi ${collectionName}:`, error);
    return null;
  }
}

export async function closeDB() {
  await client.close();
}
