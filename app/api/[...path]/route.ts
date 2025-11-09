import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Проверка доступности бэкенда при старте (только для логирования)
if (process.env.NODE_ENV === 'development') {
  console.log('[API Proxy] Backend URL:', API_BASE_URL);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  const { path } = await params;
  const pathString = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  
  // Убеждаемся, что URL формируется правильно без двойных слешей
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const url = `${baseUrl}/${pathString}${searchParams ? `?${searchParams}` : ''}`;

  // Получаем все заголовки из запроса
  const headers: HeadersInit = {};
  request.headers.forEach((value, key) => {
    // Передаем все заголовки, включая Authorization
    headers[key] = value;
  });

  // Получаем тело запроса, если есть
  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      body = await request.text();
    } catch (e) {
      // Игнорируем ошибки чтения тела
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const responseData = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    // Логирование только критических ошибок
    if (!response.ok && response.status >= 500 && process.env.NODE_ENV === 'development') {
      console.error('[API Proxy] Server error:', response.status, url);
    }

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('[API Proxy] Fetch error:', error);
    
    // Более понятные сообщения об ошибках
    let errorMessage = 'Failed to proxy request';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        errorMessage = 'Backend server is not available. Please check if the backend is running.';
        statusCode = 503; // Service Unavailable
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: statusCode }
    );
  }
}

