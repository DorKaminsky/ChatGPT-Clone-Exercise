import { NextRequest } from 'next/server';
import { dataService } from '@/lib/data-service';
import type { UploadResponse } from '@/lib/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type by extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return Response.json(
        {
          error: `Invalid file type. Only Excel files (.xlsx, .xls) are supported. Received: ${file.name}`
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
      // Some browsers don't set MIME type correctly, so we allow empty MIME if extension is valid
      console.warn(`File MIME type not recognized: ${file.type}, but extension is valid`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return Response.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the Excel file
    let parsedData;
    try {
      parsedData = dataService.parseExcelFile(buffer, file.name);
    } catch (parseError: any) {
      console.error('Error parsing Excel file:', parseError);
      return Response.json(
        {
          error: `Failed to parse Excel file: ${parseError.message || 'Unknown error'}`
        },
        { status: 400 }
      );
    }

    // Store in memory
    const dataSourceId = dataService.storeData(parsedData);

    // Prepare response
    const response: UploadResponse = {
      dataSourceId,
      fileName: parsedData.fileName,
      schema: parsedData.schema,
      preview: parsedData.preview
    };

    return Response.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return Response.json(
      {
        error: `Upload failed: ${error.message || 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve uploaded data info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dataSourceId = searchParams.get('id');

  if (!dataSourceId) {
    // Return all data sources
    const allSources = dataService.getAllDataSources();
    return Response.json({
      dataSources: allSources.map(ds => ({
        dataSourceId: ds.id,
        fileName: ds.fileName,
        schema: ds.schema
      }))
    });
  }

  const data = dataService.getData(dataSourceId);

  if (!data) {
    return Response.json(
      { error: 'Data source not found' },
      { status: 404 }
    );
  }

  return Response.json({
    dataSourceId: data.id,
    fileName: data.fileName,
    schema: data.schema,
    preview: data.preview
  });
}
