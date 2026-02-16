
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File as FileIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DropzoneProps {
    onFileSelect: (file: File) => void;
    file: File | null;
    onClear: () => void;
    disabled?: boolean;
}

export function Dropzone({ onFileSelect, file, onClear, disabled }: DropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragActive(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                onFileSelect(droppedFile);
            } else {
                alert('Por favor, envie apenas arquivos PDF.');
            }
        }
    }, [onFileSelect, disabled]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect]);

    return (
        <div className="w-full max-w-xl mx-auto">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={twMerge(
                            "relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out cursor-pointer group",
                            isDragActive
                                ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
                                : "border-gray-700 bg-gray-800/50 hover:bg-gray-800/80 hover:border-blue-400",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileInput}
                            disabled={disabled}
                        />

                        <div className="flex flex-col items-center justify-center text-center gap-4">
                            <div className={twMerge(
                                "p-4 rounded-full bg-gray-800 ring-1 ring-white/10 transition-transform duration-300",
                                isDragActive ? "scale-110 bg-blue-500/20" : "group-hover:scale-110"
                            )}>
                                <Upload className={twMerge(
                                    "w-8 h-8 transition-colors duration-300",
                                    isDragActive ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"
                                )} />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-gray-200">
                                    {isDragActive ? "Solte o PDF aqui!" : "Clique ou arraste seu PDF aqui"}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Sem limites de tamanho (Processamento local)
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="selected-file"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative bg-gray-800/80 border border-gray-700 rounded-xl p-6 flex items-center gap-4 shadow-xl"
                    >
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <FileIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">
                                {file.name}
                            </p>
                            <p className="text-sm text-gray-400">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={onClear}
                            disabled={disabled}
                            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
                            title="Remover arquivo"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
