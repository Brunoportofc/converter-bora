
export const runGhostscript = async (inputFile: File): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        let worker: Worker | null = null;
        let timeoutId: any = null;

        try {
            worker = new Worker('/gs-worker.js');
            const buffer = await inputFile.arrayBuffer();

            // Timeout to prevent infinite freeze
            timeoutId = setTimeout(() => {
                if (worker) worker.terminate();
                reject(new Error('Tempo limite excedido. O processamento demorou muito.'));
            }, 60000); // 60 seconds

            worker.onmessage = (e) => {
                const { status, data, error, message } = e.data;

                if (status === 'success' && data) {
                    if (timeoutId) clearTimeout(timeoutId);
                    resolve(data);
                    worker?.terminate();
                } else if (status === 'error') {
                    if (timeoutId) clearTimeout(timeoutId);
                    reject(new Error(error));
                    worker?.terminate();
                } else if (status === 'log') {
                    console.log(message);
                }
            };

            worker.onerror = (err) => {
                if (timeoutId) clearTimeout(timeoutId);
                console.error('Worker error:', err);
                reject(new Error('Falha na inicialização do Worker.'));
                worker?.terminate();
            };

            // Send data to worker, transferring buffer ownership for performance
            worker.postMessage(
                {
                    command: 'compress',
                    fileBuffer: buffer,
                    inputFileName: 'input.pdf'
                },
                [buffer]
            );

        } catch (error) {
            if (timeoutId) clearTimeout(timeoutId);
            if (worker) worker.terminate();
            reject(error);
        }
    });
};
