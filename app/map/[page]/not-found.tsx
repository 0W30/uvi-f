import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          Страница не найдена
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Указанная страница карты не существует.
        </p>
        <Link
          href="/map/1"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Перейти на первую страницу
        </Link>
      </div>
    </div>
  );
}

