let gsModule: any = null;

// Helper to load the script dynamically
const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.body.appendChild(script);
    });
};

export const initGhostscript = async () => {
    if (gsModule) return gsModule;

    // Polyfill exports if needed by the script
    if (typeof (window as any).exports === 'undefined') {
        (window as any).exports = {};
    }

    await loadScript('/gs/gs.js');

    // The script should have populated window.exports.Module
    const ModuleFactory = (window as any).exports.Module;

    if (!ModuleFactory) {
        throw new Error('Ghostscript WASM module factory not found. Check gs.js loading.');
    }

    gsModule = await ModuleFactory({
        locateFile: (path: string, prefix: string) => {
            if (path.endsWith('.wasm')) {
                return '/gs/gs.wasm';
            }
            return prefix + path;
        },
        print: (text: string) => console.log('[GS]', text),
        printErr: (text: string) => console.error('[GS Error]', text),
    });

    return gsModule;
};

export const runGhostscript = async (inputFile: File): Promise<Blob> => {
    const module = await initGhostscript();

    const inputFileName = 'input.pdf';
    const outputFileName = 'output.pdf';

    // Write input file to Emscripten FS
    const buffer = await inputFile.arrayBuffer();
    module.FS.writeFile(inputFileName, new Uint8Array(buffer));

    // Build arguments
    // Note: -sDEVICE=pdfwrite ...
    const args = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/screen', // eBook or screen for compression
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        // Flags for aggressive compression (same as server-side)
        '-dColorImageDownsampleType=/Bicubic',
        '-dColorImageResolution=72',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dGrayImageResolution=72',
        '-dMonoImageDownsampleType=/Bicubic',
        '-dMonoImageResolution=72',
        '-dColorImageDownsampleThreshold=1.0',
        '-dGrayImageDownsampleThreshold=1.0',
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
        '-dDownsampleMonoImages=true',
        `-sOutputFile=${outputFileName}`,
        inputFileName
    ];

    console.log('Running GS with args:', args);

    try {
        // The first arg in callMain is typically the program name in standard C main(argc, argv),
        // but Emscripten wrappers often abstract this or expect it.
        // However, the error '/undefinedfilename in (gs)' suggests it tried to open 'gs' as a file?
        // Let's try passing ONLY the flags.
        module.callMain([...args]);
    } catch (e) {
        // Emscripten throws ExitStatus on exit, which we should catch if it's 0 (success)
        // actually callMain might not throw if NO_EXIT_RUNTIME is set, but better safe.
        console.log('GS Execution finished', e);
    }

    // Read output
    const outputFileContent = module.FS.readFile(outputFileName);
    const blob = new Blob([outputFileContent], { type: 'application/pdf' });

    // Cleanup
    try {
        module.FS.unlink(inputFileName);
        module.FS.unlink(outputFileName);
    } catch (e) { /* ignore */ }

    return blob;
};
