'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Evento onChange disparado:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      console.log('Arquivo selecionado:', selectedFile.name, selectedFile.size);
      setFile(selectedFile);
      setStatus('');
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('Enviando e comprimindo (isso pode levar alguns segundos)...');

    const formData = new FormData();
    formData.set('file', file);

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro na compressão');

      // Converte a resposta em Blob para baixar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mini_${file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setStatus('✅ Sucesso! Download iniciado.');
    } catch (error) {
      console.error(error);
      setStatus('❌ Erro ao processar. Verifique se o arquivo não é muito grande para o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">
          Esmagador de PDF
        </h1>

        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl flex flex-col gap-6 items-center">
          <div className="w-full">
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Selecione o PDF gigante (Max 180MB se rodar local/Docker)
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
            <p className={`mt-4 font-semibold ${status.includes('Sucesso') ? 'text-green-400' : 'text-yellow-400'}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
