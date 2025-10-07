import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path
    const { path: pathSegments } = await params;
    const filePath = pathSegments.join('/');
    const fullPath = path.join(process.cwd(), 'downloaded_resumes', filePath);
    
    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(fullPath);
    const baseDir = path.join(process.cwd(), 'downloaded_resumes');
    
    if (!normalizedPath.startsWith(baseDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('Not Found', { status: 404 });
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    let disposition = 'inline';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        disposition = 'attachment';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        disposition = 'attachment';
        break;
    }
    
    // Get filename for Content-Disposition header
    const filename = path.basename(fullPath);
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving resume:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}