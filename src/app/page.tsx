
'use client';

import { useState } from 'react';
import { runGhostscript } from './utils/ghostscript';
import { Dropzone } from './components/Dropzone';
import { SquashingAnimation } from './components/SquashingAnimation';
import { ResultCard } from './components/ResultCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer } from 'lucide-react';

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

  const handleCompress = async () => {
    if (!file) return;

    setAppState('COMPRESSING');

    // Give UI time to update
    await new Promise(r => setTimeout(r, 100));

    try {
      // Simulate/Show animation for a minimum time so user sees the "squashing"
      const startTime = Date.now();

      const compressedBlob = await runGhostscript(file);

      // Ensure animation plays for at least 2 seconds
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 2000) {
        await new Promise(r => setTimeout(r, 2000 - elapsedTime));
      }

      const url = window.URL.createObjectURL(compressedBlob);
      setResult({
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        downloadUrl: url
      });
      setAppState('SUCCESS');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Ocorreu um erro ao esmagar o PDF.');
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
            Reduza o tamanho dos seus arquivos localmente, sem enviar para a nuvem.
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
                <Dropzone
                  onFileSelect={handleFileSelect}
                  file={file}
                  onClear={handleClear}
                  disabled={appState === 'ERROR'} // Optional: disable while showing error? No, let them retry.
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
                        onClick={handleCompress}
                        className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full font-bold text-lg shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Esmagar Agora <Hammer className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                  Isso roda no seu navegador, pode travar um pouquinho...
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
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}
