# Как запустить сайт на этом компьютере

Всё работает локально и не трогает CRM. Порты: база 5433, магазин 9000, сайт 3100.

## 1. База данных (PostgreSQL 17)
Программа и данные: `D:\tl-dev\pgsql` и `D:\tl-dev\pgdata` (путь латиницей: PostgreSQL не работает с русскими буквами в пути).
```powershell
& "D:\tl-dev\pgsql\bin\pg_ctl.exe" -D "D:\tl-dev\pgdata" -l "D:\tl-dev\server.log" start
& "D:\tl-dev\pgsql\bin\pg_isready.exe" -p 5433 -h localhost
```
Остановить: `pg_ctl.exe -D "D:\tl-dev\pgdata" stop`. База: `trafaret_line`.

## 2. Магазин (Medusa 2.18, папка `backend`)
```powershell
$env:Path = "D:\сайт клод\сайт украина\.tools\node;" + $env:Path
cd "D:\сайт клод\сайт украина\backend"
npx medusa develop        # первый запуск ~2–3 минуты
```
Админка: http://localhost:9000/app (логин admin@trafaret-line.com.ua, пароль передан Денису в чате, в файлах не хранится).
Наполнение с нуля: `npx medusa db:migrate`, затем `npx medusa exec ./src/scripts/seed-trafaret.ts`.
Приём заказа: `POST /store/tl-checkout` (`backend/src/api/store/tl-checkout/route.ts`), цены пересчитываются на сервере общим кодом `backend/src/shared/lib`.

Важно: в `backend` закреплён `@swc/core@1.7.28` — новые версии отказываются работать из-за прав доступа папок Windows.

## 3. Сайт (Next.js, папка `web`)
```powershell
$env:Path = "D:\сайт клод\сайт украина\.tools\node;" + $env:Path
cd "D:\сайт клод\сайт украина\web"
npm run dev               # или: npx next build; npx next start -p 3100
```
Адрес: http://localhost:3100. Настройки связи с магазином: `web/.env.local` (адрес Medusa и публичный ключ витрины).

Проще всего: двойной щелчок по `Запустити сайт.bat` в корне папки, остановка — `Зупинити сайт.bat`.

## Общий код цены
`web/lib/materials.ts`, `web/lib/calculators/{geometry,pricing,signage}.ts`, `web/lib/export/layers.ts` и `web/types/*` скопированы в `backend/src/shared`. Меняете формулу — копируйте файл в оба места (одинаковые относительные пути).

## Ключи сервисов (web/.env.local, образец `web/.env.example`)
Без ключа сервис отвечает понятной ошибкой `not_configured` со списком нужных переменных, а сайт продолжает работать (поле города и отделения становится обычным полем, доставка «за тарифом»).

| Сервис | Переменная | Роуты |
| --- | --- | --- |
| Нова Пошта | `NP_API_KEY` | `GET /api/novaposhta/cities?q=`, `GET /api/novaposhta/warehouses?cityRef=&l=&w=&h=&kg=`, `POST /api/novaposhta/price` |
| Вчасно.Каса | `VCHASNO_KASA_TOKEN`, `VCHASNO_TAXGRP=2` | `POST /api/vchasno-kasa/receipt`, `POST /api/vchasno-kasa/shift` (только с `Authorization: Bearer INTERNAL_API_TOKEN`) |
| Google AI Studio | `GEMINI_API_KEY`, `GEMINI_MODEL` | `POST /api/google-ai/chat` (20 запросов за 10 минут с одного адреса) |
| Opendatabot | `OPENDATABOT_API_KEY` | `GET /api/opendatabot?code=` (ЄДРПОУ 8 цифр или РНОКПП 10, контрольная сумма проверяется до платного запроса) |

`INTERNAL_API_TOKEN` одинаковый в `web/.env.local` и `backend/.env`: после оплаты WayForPay магазин (`backend/src/api/hooks/wayforpay`) просит сайт выдать чек, номер чека пишется в заказ (`metadata.receiptNumber`).

## Конструкторы
- `/konstruktor` — «Свій напис»: трафарет (мостики ставит Clipper2 в самом тонком месте штриха, `web/lib/geometry/bridges.ts`) или «цілим словом» для топперов и акриловых слов (`web/lib/geometry/weld.ts`: буквы сдвигаются до перекрытия, точки і/ї/й и отдельные слова соединяются, планка под словом, обводка, шпажки).
- `/konstruktor/polotno` — свободное полотно на Fabric.js (`components/constructor/Canvas2D.tsx`): сетка, отступ от края, живой рез с мостиками, метки проблем (деталь без мостика, тонкое место, узкая прорезь, выход за край).

## Файлы клиентов
Макеты из «За вашим макетом» сохраняются в backend/uploads/layouts/ДАТА/ (ключ записан в позиции заказа, поле uploadKey). На сервере перенесём в хранилище S3.

## Оплата WayForPay
В backend/.env сейчас публичный тестовый мерчант из документации (отклоняет все платежи). Для настоящих платежей вписать WFP_MERCHANT и WFP_SECRET из кабинета WayForPay Дениса. Ответ банка: POST /hooks/wayforpay (должен быть доступен из интернета, на локальном компьютере не работает).

## Каталог из ветки «Наполнение каталога»
Данные: `catalog/data/*.json`, фото и SVG: `catalog/images/...` (распакованы из частей `catalog/export/parts10/photos-NN.zip` библиотеки проекта).
1. Импорт (код: `backend/src/scripts/import-catalog.ts` и `backend/src/lib/catalog-import/`, присылает ветка каталога; товары создаются черновиками). Режимы: по умолчанию `IMPORT_MODE=create` добавляет только новые, `IMPORT_MODE=update` ещё и обновляет существующие по handle (тексты, фото, файлы резки, варианты по SKU), статус не трогает:
   `CATALOG_DIR="D:\сайт клод\сайт украина\catalog" npx medusa exec ./src/scripts/import-catalog.ts` в папке `backend`.
   Важно: на время импорта остановите `medusa develop` (на ноутбуке они мешают друг другу, импорт «висит»).
2. Показать каталог на ноутбуке: `CATALOG_ACTION=publish-imported npx medusa exec ./src/scripts/catalog-status.ts` (публикует импортированное, прячет 7 демо-товаров). Вернуть в черновики: `CATALOG_ACTION=draft-imported`.
Витрина читает разделы и товары из Medusa (`web/services/medusa-store.ts`), кэш 5 минут. Цена товара каталога — цена варианта в базе, оптовая шкала та же, что у трафаретов.