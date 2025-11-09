# Docker Deployment Guide

## Production Deployment

### Сборка и запуск

```bash
# Сборка образа
docker-compose build

# Запуск в production режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f frontend

# Остановка
docker-compose down
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
NEXT_PUBLIC_API_URL=http://backend:8000
DATABASE_URL=postgresql://user:password@db:5432/dbname
```

## Development Mode

Для разработки используйте отдельный compose файл:

```bash
# Запуск в dev режиме
docker-compose -f docker-compose.dev.yml up

# С пересборкой
docker-compose -f docker-compose.dev.yml up --build
```

## Настройка бэкенда

В файле `docker-compose.yml` замените `your-backend-image:latest` на реальный образ вашего бэкенда или используйте `build` секцию:

```yaml
backend:
  build:
    context: ../backend  # Путь к бэкенду
    dockerfile: Dockerfile
```

## Полезные команды

```bash
# Пересборка без кэша
docker-compose build --no-cache

# Остановка и удаление контейнеров
docker-compose down

# Остановка, удаление контейнеров и volumes
docker-compose down -v

# Просмотр статуса
docker-compose ps

# Выполнение команд в контейнере
docker-compose exec frontend sh
```

## Troubleshooting

### Проблемы с подключением к бэкенду

1. Убедитесь, что бэкенд запущен: `docker-compose ps`
2. Проверьте сеть: `docker network ls`
3. Проверьте логи бэкенда: `docker-compose logs backend`

### Проблемы со сборкой

1. Очистите кэш Docker: `docker system prune -a`
2. Пересоберите без кэша: `docker-compose build --no-cache`

