'use client';

import { useEffect, useRef, useState } from 'react';


interface PdfViewerProps {
  pdfPath: string;
  pageNumber: number;
  onTotalPagesChange?: (totalPages: number) => void;
}

export default function PdfViewer({ pdfPath, pageNumber, onTotalPagesChange }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTotalPagesChangeRef = useRef(onTotalPagesChange);
  const renderTaskRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  // Обновляем ref при изменении callback
  useEffect(() => {
    onTotalPagesChangeRef.current = onTotalPagesChange;
  }, [onTotalPagesChange]);

  useEffect(() => {
    const loadPage = async () => {
      if (!canvasRef.current) return;

      // Отменяем предыдущую операцию рендеринга, если она существует
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Игнорируем ошибки отмены
        }
        renderTaskRef.current = null;
      }

      try {
        setLoading(true);
        setError(null);
        const pdfjsLib = await import('pdfjs-dist'); 
        // @ts-expect-error no type definitions for pdf.worker.mjs
        await import('pdfjs-dist/build/pdf.worker.mjs');

        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL( 'pdfjs-dist/build/pdf.worker.mjs', import.meta.url ).toString();
        // Загрузка PDF документа
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        onTotalPagesChangeRef.current?.(pdf.numPages);

        // Проверка валидности номера страницы
        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          setError(`Страница ${pageNumber} не существует. Всего страниц: ${pdf.numPages}`);
          setLoading(false);
          return;
        }

        // Проверяем, что canvas еще существует (компонент не размонтирован)
        if (!canvasRef.current) {
          return;
        }

        // Получение страницы
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.0 });

        // Настройка canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) {
          setError('Не удалось получить контекст canvas');
          setLoading(false);
          return;
        }

        // Проверяем еще раз перед рендерингом
        if (!canvasRef.current) {
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Рендеринг страницы
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        
        // Проверяем, что операция не была отменена
        if (renderTaskRef.current === renderTask) {
          renderTaskRef.current = null;
          setLoading(false);
        }
      } catch (err: any) {
        // Игнорируем ошибки отмены
        if (err?.name === 'RenderingCancelledException' || err?.message?.includes('cancelled')) {
          return;
        }
        console.error('Ошибка загрузки PDF:', err);
        setError(err instanceof Error ? err.message : 'Не удалось загрузить PDF');
        setLoading(false);
        renderTaskRef.current = null;
      }
    };

    loadPage();

    // Cleanup функция для отмены рендеринга при размонтировании или изменении зависимостей
    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Игнорируем ошибки отмены
        }
        renderTaskRef.current = null;
      }
    };
  }, [pdfPath, pageNumber]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-2">
          Ошибка
        </div>
        <div className="text-zinc-600 dark:text-zinc-400 text-center">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-zinc-600 dark:text-zinc-400">Загрузка страницы...</div>
        </div>
      )}
      <div className={`${loading ? 'hidden' : 'relative'} w-full flex justify-center bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg`}>
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto shadow-lg"
          style={{ display: loading ? 'none' : 'block' }}
        />
      </div>
      {totalPages && (
        <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          Страница {pageNumber} из {totalPages}
        </div>
      )}
    </div>
  );
}

