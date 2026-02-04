# TestSvgPlannerConverter

Минималистичный фронт для potrace.

## Локальный запуск
Открой `index.html` в браузере и загрузи изображение.

## Деплой
Проект — чистый статик (без сборки).

### Vercel
1. Импортируй репозиторий в Vercel.
2. В настройках проекта выбери Framework Preset = `Other`.
3. Output Directory = `.` (корень проекта).
4. Build Command оставь пустым.

Файл `vercel.json` уже настроен под эти параметры.

### Render
1. Создай Static Site и подключи репозиторий.
2. Publish Directory = `.` (корень проекта).
3. Build Command пустой.

Файл `render.yaml` уже настроен под эти параметры.
