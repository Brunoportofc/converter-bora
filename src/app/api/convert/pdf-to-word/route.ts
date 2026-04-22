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

    const tempDir = os.tmpdir();
    const inputPath = join(tempDir, `input-${Date.now()}.pdf`);
    const outputPath = join(tempDir, `output-${Date.now()}.docx`);

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(inputPath, buffer);

        const strategy = formData.get('strategy') as string;

        // Determine Python command (python3 on Linux/Mac, python on Windows)
        const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';

        const scriptName = strategy === 'text-only' ? 'convert_text_only.py' : 'convert_pdf_to_docx.py';
        const scriptPath = join(process.cwd(), 'src', 'scripts', scriptName);

        // Execute Python conversion script
        await execAsync(`"${pythonCommand}" "${scriptPath}" "${inputPath}" "${outputPath}"`);


        const docxBuffer = await readFile(outputPath);

        // Cleanup
        await unlink(inputPath);
        await unlink(outputPath);

        return new NextResponse(docxBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '')}.docx"`,
            },
        });

    } catch (error) {
        console.error('Conversion error:', error);
        return NextResponse.json(
            { error: 'Falha na conversão. Verifique se o Python está instalado corretamente.' },
            { status: 500 }
        );
    }
}
