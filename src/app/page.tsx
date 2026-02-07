'use client';

import { useState, useEffect } from 'react';
import { runGhostscript } from './utils/ghostscript';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0); // Emulate progress or use logs if possible

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('');
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('Inicializando motor de compressão (isso roda no seu navegador)...');

    // Pequeno delay para permitir que a UI atualize antes de travar a thread (se não usarmos worker)
    await new Promise(r => setTimeout(r, 100));

    try {
      setStatus('Esmagando PDF... (Pode travar um pouquinho, aguente firme!)');

      const compressedBlob = await runGhostscript(file);

      const url = window.URL.createObjectURL(compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mini_${file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setStatus(`✅ Sucesso! Reduzido de ${(file.size / 1024 / 1024).toFixed(2)}MB para ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Erro: ${error.message || 'Falha desconhecida'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">
          Esmagador de PDF (Client-Side)
        </h1>

        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl flex flex-col gap-6 items-center">
          <div className="w-full">
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Selecione o PDF gigante (Sem limites de tamanho!)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                cursor-pointer border border-gray-700 rounded-lg bg-gray-800"
            />
          </div>

          {file && (
            <div className="text-gray-400">
              Arquivo selecionado: <span className="text-white font-bold">{file.name}</span>
              <span className="text-xs ml-2">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          )}

          <button
            onClick={handleCompress}
            disabled={!file || loading}
            className={`w-full py-4 px-8 rounded-lg font-bold text-lg transition-all
              ${!file || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/50'
              }`}
          >
            {loading ? 'Processando...' : 'Esmagar PDF 🔨'}
          </button>

          {status && (
            <p className={`mt-4 font-semibold text-center ${status.includes('Sucesso') ? 'text-green-400' : 'text-yellow-400'}`}>
              {status}
            </p>
          )}

          <p className="text-xs text-center text-gray-500 mt-2">
            Nota: Todo o processamento é feito no seu dispositivo. Nada é enviado para a nuvem.
          </p>
        </div>
      </div>
    </main>
  );
}
