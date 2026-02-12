import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saves a file to the public/uploads directory
 * Returns the public URL of the saved file
 */
export async function saveFile(file: File, subDir: string = ''): Promise<{ url: string; fileName: string }> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const ext = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', subDir);
    try {
        await mkdir(uploadDir, { recursive: true });
    } catch (e) {
        // Already exists or ignore
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Public URL starting with /uploads/
    const url = `/uploads/${subDir ? subDir + '/' : ''}${fileName}`;

    return { url, fileName: file.name };
}
