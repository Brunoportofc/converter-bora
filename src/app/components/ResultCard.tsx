
'use client';

import { motion } from 'framer-motion';
import { Download, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ResultCardProps {
    originalSize: number;
    compressedSize: number;
    fileName: string;
    downloadUrl: string;
    onReset: () => void;
}

export function ResultCard({ originalSize, compressedSize, fileName, downloadUrl, onReset }: ResultCardProps) {
    const savings = originalSize - compressedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md mx-auto bg-gray-900 border border-green-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />

            <div className="flex flex-col items-center text-center">
                <div className="mb-4 p-4 bg-green-500/10 rounded-full ring-1 ring-green-500/20">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">Prontinho!</h3>
                <p className="text-gray-400 text-sm mb-6">Seu arquivo foi esmagado com sucesso.</p>

                <div className="grid grid-cols-3 gap-0 w-full mb-8 items-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Antigo</p>
                        <p className="text-gray-300 font-mono mt-1">{formatSize(originalSize)}</p>
                    </div>
                    <div className="flex justify-center flex-col items-center">
                        <ArrowRight className="w-5 h-5 text-gray-600" />
                        <span className="text-xs text-green-400 font-bold mt-1">-{savingsPercent}%</span>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Novo</p>
                        <p className="text-green-400 font-mono font-bold mt-1">{formatSize(compressedSize)}</p>
                    </div>
                </div>

                <div className="flex flex-col w-full gap-3">
                    <a
                        href={downloadUrl}
                        download={`mini_${fileName}`}
                        className={twMerge(
                            "flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all transform hover:-translate-y-1 active:scale-95",
                            "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/40"
                        )}
                    >
                        <Download className="w-5 h-5" />
                        Baixar agora
                    </a>

                    <button
                        onClick={onReset}
                        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Esmagar outro PDF
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
