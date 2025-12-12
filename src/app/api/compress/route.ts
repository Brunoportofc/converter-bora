import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Define caminhos temporários
    const tempDir = os.tmpdir();
    const inputPath = join(tempDir, `input-${Date.now()}.pdf`);
    const outputPath = join(tempDir, `output-${Date.now()}.pdf`);

    try {
        // 1. Salva o arquivo recebido no disco temporário
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(inputPath, buffer);

        // 2. Define o comando do Ghostscript
        // Compressão AGRESSIVA mas COLORIDA:
        // - /screen = 72dpi base
        // - JPEG quality baixa (30-40)
        // - Downsample para 72dpi
        // - Mantém cores (sem DeviceGray)
        const gsExecutable = os.platform() === 'win32' ? 'gswin64c' : 'gs';
        const gsCommand = `${gsExecutable} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dColorImageDownsampleType=/Bicubic -dColorImageResolution=72 -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=72 -dMonoImageDownsampleType=/Bicubic -dMonoImageResolution=72 -dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0 -dDownsampleColorImages=true -dDownsampleGrayImages=true -dDownsampleMonoImages=true -dAutoFilterColorImages=false -dAutoFilterGrayImages=false -dColorImageFilter=/DCTEncode -dGrayImageFilter=/DCTEncode -sColorConversionStrategy=RGB -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

        console.log('🔄 Processando PDF...');
        await execAsync(gsCommand);

        // 3. Lê o arquivo processado
        const compressedPdf = await readFile(outputPath);

        // 4. Limpeza (deleta arquivos temporários)
        await unlink(inputPath);
        await unlink(outputPath);

        // 5. Retorna o arquivo para o usuário
        return new NextResponse(compressedPdf, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="comprimido_${file.name}"`,
            },
        });

    } catch (error) {
        console.error('Erro na compressão:', error);
        return NextResponse.json({ error: 'Falha ao comprimir o PDF. O Ghostscript está instalado?' }, { status: 500 });
    }
}
