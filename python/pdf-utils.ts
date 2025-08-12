// lib/pdf-utils.ts
import { spawn } from 'child_process';
import path from 'path';
import { writeFile, readFile } from 'fs/promises';
import { randomUUID } from 'crypto';

export async function generateLeavePdf(leaveData: any): Promise<Buffer> {
    const scriptPath = path.resolve('python/generate_leave_form.py'); // Adjust if needed
    const tempInputPath = path.resolve('tmp', `${randomUUID()}_leave_data.json`);
    const tempOutputPath = path.resolve('tmp', `${randomUUID()}_leave_form.pdf`);

    await writeFile(tempInputPath, JSON.stringify(leaveData));

    return new Promise((resolve, reject) => {
        const child = spawn('python', [scriptPath, tempInputPath, tempOutputPath]);

        child.on('exit', async (code) => {
            if (code === 0) {
                try {
                    const pdf = await readFile(tempOutputPath);
                    resolve(pdf);
                } catch (err) {
                    reject(err);
                }
            } else {
                reject(new Error(`Python script failed with code ${code}`));
            }
        });

        child.stderr.on('data', (data) => {
            console.error(`PDF ERROR: ${data}`);
        });
    });
}
