
'use client';

import { useState } from 'react';
import { runGhostscript } from './utils/ghostscript';
import { Dropzone } from './components/Dropzone';
import { SquashingAnimation } from './components/SquashingAnimation';
import { ResultCard } from './components/ResultCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer } from 'lucide-react';
import { clsx } from 'clsx';


type AppState = 'IDLE' | 'SELECTED' | 'COMPRESSING' | 'SUCCESS' | 'ERROR';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [result, setResult] = useState<{
    originalSize: number;
    compressedSize: number;
    downloadUrl: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setAppState('SELECTED');
    setErrorMessage('');
  };

  const handleClear = () => {
    setFile(null);
    setAppState('IDLE');
    setResult(null);
  };

  const [mode, setMode] = useState<'compress' | 'convert'>('compress');
  const [textOnly, setTextOnly] = useState(false);

  const handleProcess = async () => {

    if (!file) return;

    setAppState('COMPRESSING');
    await new Promise(r => setTimeout(r, 100)); // UI update

    try {
      if (mode === 'compress') {
        const startTime = Date.now();
        const compressedBlob = await runGhostscript(file);
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 2000) await new Promise(r => setTimeout(r, 2000 - elapsedTime));

        const url = window.URL.createObjectURL(compressedBlob);
        setResult({
          originalSize: file.size,
          compressedSize: compressedBlob.size,
          downloadUrl: url
        });
      } else {
        // Conversion Mode
        const formData = new FormData();
        formData.append('file', file);
        if (textOnly) {
          formData.append('strategy', 'text-only');
        }

        const response = await fetch('/api/convert/pdf-to-word', {

          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Erro na conversão');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        setResult({
          originalSize: file.size,
          compressedSize: 0, // Not relevant for conversion
          downloadUrl: url
        });
      }
      setAppState('SUCCESS');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || `Erro ao ${mode === 'compress' ? 'esmagar' : 'converter'} o PDF.`);
      setAppState('ERROR');
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-4xl w-full flex flex-col items-center justify-center font-sans">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Hammer className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
              Esmagador de PDF
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            {mode === 'compress'
              ? "Reduza o tamanho dos seus arquivos localmente, sem enviar para a nuvem."
              : "Transforme seus PDFs em documentos Word editáveis."}
          </p>

        </motion.div>

        {/* Content Area */}
        <div className="w-full relative min-h-[400px] flex items-center justify-center">
          <AnimatePresence mode="wait">

            {/* IDLE & SELECTED States */}
            {(appState === 'IDLE' || appState === 'SELECTED' || appState === 'ERROR') && (
              <motion.div
                key="input-section"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-8"
              >

                <div className="flex justify-center mb-8">
                  <div className="bg-gray-800 p-1 rounded-lg flex items-center">
                    <button
                      onClick={() => setMode('compress')}
                      className={clsx(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        mode === 'compress' ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-white"
                      )}
                    >
                      Comprimir
                    </button>
                    <button
                      onClick={() => setMode('convert')}
                      className={clsx(
                        "px-4 py-2 rounded-md text-sm font-medium transition-all",
                        mode === 'convert' ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                      )}
                    >
                      Converter para Word
                    </button>
                  </div>
                </div>

                {mode === 'convert' && (
                  <div className="flex justify-center mb-6">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={textOnly}
                          onChange={(e) => setTextOnly(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={clsx(
                          "w-10 h-6 rounded-full transition-colors",
                          textOnly ? "bg-blue-600" : "bg-gray-700"
                        )}></div>
                        <div className={clsx(
                          "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform transform",
                          textOnly ? "translate-x-4" : "translate-x-0"
                        )}></div>
                      </div>
                      <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                        Modo Texto Puro (Corrige caracteres estranhos)
                      </span>
                    </label>
                  </div>
                )}

                <Dropzone

                  onFileSelect={handleFileSelect}
                  file={file}
                  onClear={handleClear}
                  disabled={appState === 'ERROR'}
                />

                {appState === 'ERROR' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-red-400 bg-red-900/20 px-4 py-3 rounded-lg text-center mx-auto border border-red-900/50"
                  >
                    {errorMessage}
                    <button onClick={() => setAppState('SELECTED')} className="underline ml-2 hover:text-red-300">Tentar novamente</button>
                  </motion.div>
                )}

                <div className="h-16 flex justify-center">
                  <AnimatePresence>
                    {appState === 'SELECTED' && file && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={handleProcess}
                        className={clsx(
                          "group relative px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 overflow-hidden hover:scale-105",
                          mode === 'compress'
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-900/30 hover:shadow-blue-900/50"
                            : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/30 hover:shadow-emerald-900/50"
                        )}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {mode === 'compress' ? 'Esmagar Agora' : 'Converter Agora'}
                          <Hammer className={clsx("w-5 h-5 transition-transform", mode === 'compress' && "group-hover:rotate-12")} />
                        </span>
                        <div className={clsx(
                          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          mode === 'compress' ? "from-indigo-600 to-blue-600" : "from-teal-600 to-emerald-600"
                        )} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* COMPRESSING State */}
            {appState === 'COMPRESSING' && (
              <motion.div
                key="compressing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <SquashingAnimation />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-gray-500 mt-8 text-sm"
                >
                  {mode === 'compress'
                    ? "Isso roda no seu navegador, pode travar um pouquinho..."
                    : "Enviando para o servidor para conversão..."}

                </motion.p>
              </motion.div>
            )}

            {/* SUCCESS State */}
            {appState === 'SUCCESS' && result && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <ResultCard
                  originalSize={result.originalSize}
                  compressedSize={result.compressedSize}
                  fileName={file?.name || 'arquivo.pdf'}
                  downloadUrl={result.downloadUrl}
                  onReset={handleClear}
                  mode={mode}
                />

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}
