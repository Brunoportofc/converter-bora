
// This is a Web Worker for running Ghostscript
// It communicates with the main thread via postMessage

// We need to declare the global scope for the worker to avoid TS errors in IDE, 
// but this file is being served as raw JS to the browser.

var gsModule = null;

// Initialize Ghostscript Module
async function initGhostscript() {
    if (gsModule) return gsModule;

    // Clean up any previous attempts
    if (self.Module) {
        delete self.Module;
    }

    // Define Module object *before* loading script to hook into it
    var Module = {
        locateFile: function (path, prefix) {
            if (path.endsWith('.wasm')) {
                return '/gs/gs.wasm';
            }
            return prefix + path;
        },
        print: function (text) {
            postMessage({ status: 'log', message: '[GS StdOut] ' + text });
        },
        printErr: function (text) {
            postMessage({ status: 'log', message: '[GS StdErr] ' + text });
        },
        onRuntimeInitialized: function () {
            postMessage({ status: 'log', message: '[GS Worker] Runtime initialized.' });
        }
    };

    self.Module = Module;

    try {
        if (typeof importScripts === 'function') {
            importScripts('/gs/gs.js');
        } else {
            throw new Error('importScripts not available');
        }
    } catch (e) {
        throw new Error('Failed to load gs.js: ' + e.message);
    }

    // After script load, Emscripten populates the Module object (or returns a Promise if it's modularized)
    // The specific gs.js build seems to use a factory pattern: var Module = (() => { ... return function(Module) {...} })()
    // Wait, looking at the file: var Module = (() => { ... return function(Module) { ... } })();
    // So 'Module' becomes the factory function.

    var ModuleFactory = self.Module;

    if (typeof ModuleFactory !== 'function') {
        if (!ModuleFactory) {
            throw new Error('Ghostscript WASM module factory not found. Is gs.js loaded?');
        }
    }

    // Initialize
    gsModule = await ModuleFactory(Module);
    return gsModule;
}

self.onmessage = async function (e) {
    var data = e.data;
    var command = data.command;
    var fileBuffer = data.fileBuffer;
    var inputFileName = data.inputFileName || 'input.pdf';

    if (command !== 'compress') return;

    try {
        postMessage({ status: 'log', message: 'Worker received job. Initializing GS...' });

        // Safety timeout for initialization
        var timeout = new Promise(function (_, reject) {
            setTimeout(function () { reject(new Error('GS Initialization timeout')); }, 15000);
        });

        var modulePromise = initGhostscript();

        var module = await Promise.race([modulePromise, timeout]);

        var outputFileName = 'output.pdf';

        postMessage({ status: 'log', message: 'Writing file to memory...' });
        // Write input file to virtual FS
        module.FS.writeFile(inputFileName, new Uint8Array(fileBuffer));

        var args = [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.4',
            '-dPDFSETTINGS=/screen',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
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
            '-sOutputFile=' + outputFileName,
            inputFileName
        ];

        postMessage({ status: 'log', message: 'Running GS command...' });

        try {
            module.callMain(args);
        } catch (err) {
            // Emscripten might throw ExitStatus
            // postMessage({ status: 'log', message: 'GS finished with potential exit status: ' + err });
        }

        // Check if output file exists by trying to read it
        var outputFileContent;
        try {
            outputFileContent = module.FS.readFile(outputFileName);
        } catch (e) {
            throw new Error('Output file was not generated (readFile failed)');
        }

        // Read result
        var blob = new Blob([outputFileContent], { type: 'application/pdf' });

        // Cleanup
        try {
            module.FS.unlink(inputFileName);
            module.FS.unlink(outputFileName);
        } catch (e) { /* ignore */ }

        // Send back result
        postMessage({ status: 'success', data: blob });

    } catch (error) {
        postMessage({ status: 'error', error: error.message || 'Worker error' });
    }
};
