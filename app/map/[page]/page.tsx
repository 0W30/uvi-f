import { notFound } from 'next/navigation';
import MapPageClient from './MapPageClient';

interface MapPageProps {
  params: Promise<{
    page: string;
  }>;
}

export default async function MapPage({ params }: MapPageProps) {
  const { page } = await params;
  const pageNumber = parseInt(page, 10);

  // Проверка валидности номера страницы
  if (isNaN(pageNumber) || pageNumber < 1) {
    notFound();
  }

  return <MapPageClient pageNumber={pageNumber} />;
}

