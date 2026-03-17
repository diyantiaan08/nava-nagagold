import { useEffect, useState } from 'react';
import { Database, Link, RefreshCw, RotateCcw, Save, Shield } from 'lucide-react';
import {
  fetchStoredConnectionContext,
  loadManualConnectionSettings,
  resolveConnectionSettings,
  saveManualConnectionSettings,
  saveStoredConnectionContext,
  resetStoredConnectionContext,
} from '../lib/connectionSettings';

interface ConnectionSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onReset: () => void;
}

const sourceLabels = {
  manual: 'Manual override',
  env: 'VITE_API_URL',
  default: 'Default lokal',
} as const;

export function ConnectionSettingsPanel({
  open,
  onClose,
  onSaved,
  onReset,
}: ConnectionSettingsPanelProps) {
  const [backendUrl, setBackendUrl] = useState('');
  const [upstreamBaseUrl, setUpstreamBaseUrl] = useState('');
  const [upstreamToken, setUpstreamToken] = useState('');
  const [activeUpstreamBaseUrl, setActiveUpstreamBaseUrl] = useState('');
  const [activeTokenPreview, setActiveTokenPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setIsLoading(true);
      setError('');
      setNotice('');
      const manual = loadManualConnectionSettings();
      const resolved = resolveConnectionSettings();
      const initialBackendUrl = manual.backendUrl || resolved.apiBase;
      setBackendUrl(initialBackendUrl);

      try {
        const payload = await fetchStoredConnectionContext(initialBackendUrl);
        const context = payload.context || {};
        const resolvedContext = payload.resolved || {};
        setUpstreamBaseUrl(context.upstream_base_url || '');
        setUpstreamToken('');
        setActiveUpstreamBaseUrl(resolvedContext.upstream_base_url || context.upstream_base_url || '');
        setActiveTokenPreview(
          context.has_upstream_token ? context.token_preview || 'Token tersedia' : 'Belum diisi'
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan koneksi.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [open]);

  if (!open) return null;

  const resolved = resolveConnectionSettings();

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      saveManualConnectionSettings({ backendUrl });
      const payload = await saveStoredConnectionContext({
        apiBase: backendUrl,
        upstreamBaseUrl,
        upstreamToken,
      });
      const context = payload.context || {};
      setActiveUpstreamBaseUrl(context.upstream_base_url || '');
      setActiveTokenPreview(context.has_upstream_token ? context.token_preview || 'Token tersedia' : 'Belum diisi');
      setNotice('Pengaturan koneksi berhasil disimpan.');
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan pengaturan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      await resetStoredConnectionContext(backendUrl || resolved.apiBase);
      setUpstreamBaseUrl('');
      setUpstreamToken('');
      setActiveUpstreamBaseUrl('');
      setActiveTokenPreview('Belum diisi');
      onReset();
      onClose();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Gagal mereset pengaturan koneksi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 pb-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pengaturan Koneksi Manual</h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Browser hanya memanggil backend bot. URL program toko emas dan token disimpan di backend.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            Tutup
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <Link className="h-4 w-4" />
              Backend URL
            </span>
            <input
              type="url"
              value={backendUrl}
              onChange={(event) => setBackendUrl(event.target.value)}
              placeholder="https://api-bot.domainanda.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <Database className="h-4 w-4" />
              URL Program Toko Emas
            </span>
            <input
              type="url"
              value={upstreamBaseUrl}
              onChange={(event) => setUpstreamBaseUrl(event.target.value)}
              placeholder="https://qc-cabang.nagatech.id"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              Token Program Toko Emas
            </span>
            <textarea
              value={upstreamToken}
              onChange={(event) => setUpstreamToken(event.target.value)}
              placeholder="Masukkan token akses dari program toko emas"
              rows={3}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
            />
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white/80 p-3 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
          <p>
            Backend aktif: <span className="font-semibold text-gray-900 dark:text-white">{resolved.apiBase}</span>
          </p>
          <p className="mt-1">
            Sumber backend: <span className="font-semibold text-gray-900 dark:text-white">{sourceLabels[resolved.source]}</span>
          </p>
          <p className="mt-1">
            Upstream aktif: <span className="font-semibold text-gray-900 dark:text-white">{activeUpstreamBaseUrl || 'Belum diisi'}</span>
          </p>
          <p className="mt-1">
            Token upstream: <span className="font-semibold text-gray-900 dark:text-white">{activeTokenPreview || 'Belum diisi'}</span>
          </p>
        </div>

        {(error || notice) && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              error
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                : 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
            }`}
          >
            {error || notice}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? 'Memuat pengaturan dari backend...' : 'Gunakan tombol simpan untuk menyimpan ke MongoDB melalui backend.'}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
