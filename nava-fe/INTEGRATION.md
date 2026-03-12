# NAVA EXPERT - Integrasi Backend

## Cara Menghubungkan dengan Backend Anda

### 1. Update Endpoint Backend

Di file `src/components/ChatContainer.tsx`, ganti `YOUR_BACKEND_ENDPOINT` dengan URL backend Anda:

```typescript
const response = await fetch('https://your-backend-url.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: content }),
});
```

### 2. Format Response dari Backend

Backend Anda harus mengembalikan response dalam format JSON:

```json
{
  "response": "Jawaban dari AI assistant"
}
```

### 3. Menambahkan Authentication (Opsional)

Jika backend Anda memerlukan authentication, tambahkan header Authorization:

```typescript
const response = await fetch('https://your-backend-url.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ message: content }),
});
```

### 4. Fitur yang Tersedia

- **Chat Interface**: Interface modern dengan bubble messages
- **Theme Switcher**: 4 pilihan tema warna (Biru, Orange, Hijau, Ungu)
- **Reset Conversation**: Tombol untuk mereset percakapan
- **Responsive Design**: Tampilan optimal di mobile dan desktop
- **Loading States**: Animasi loading saat menunggu response
- **Error Handling**: Penanganan error otomatis

### 5. Customisasi

#### Mengganti Background Image

Edit `src/App.tsx` dan ganti URL gambar:

```typescript
backgroundImage: 'url(YOUR_IMAGE_URL)',
```

#### Menambah Tema Baru

Edit `src/context/ThemeContext.tsx` dan tambahkan tema baru di `themeConfig`.

#### Mengubah Placeholder Text

Edit `src/components/ChatInput.tsx` untuk mengubah teks placeholder.

## Teknologi yang Digunakan

- **React 18** dengan TypeScript
- **Tailwind CSS** untuk styling
- **Lucide React** untuk icons
- **Vite** sebagai build tool

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```
