# Тестовая версия сайта на нашем сервере

Постоянная ссылка, где видно, что уже готово: **https://test.trafaret-line.com.ua** (сайт) и **https://api-test.trafaret-line.com.ua/app** (админка магазина и «Простий кабінет»).

- Обновляется сама: после каждого слияния в `main`, когда CI зелёный, GitHub Actions собирает сайт и магазин и выкладывает их на сервер (`.github/workflows/staging.yml`). Вручную: GitHub → Actions → Staging → Run workflow.
- Закрыта паролем (окно браузера, логин `trafaret`) и от поисковиков: `robots.txt` запрещает всё, каждый ответ несёт `X-Robots-Tag: noindex`.
- Живёт у отдельного пользователя FastPanel в его папке `~/trafaret-staging`. CRM и другие сайты не затрагиваются: свой Node.js, свой pm2, своя база, свои порты 3110 и 9110.
- Оплата, Нова Пошта, Вчасно.Каса и Gemini без ключей не работают: тестовая копия их не получает.

## Что сделать Денису один раз (с телефона)

Пароли никуда не пересылаем: они вводятся только в FastPanel и в GitHub.

**1. Пользователь на сервере и ключ для GitHub**
1. Пользователь `trafaret` с полной оболочкой (bash). Его создаёт главный админ сервера (FastPanel → «Пользователи» или `useradd`).
2. На ноутбуке в PowerShell сделай пару ключей (на вопросы жми Enter):
   `ssh-keygen -t ed25519 -C github-staging -f $HOME\.ssh\trafaret_staging`
3. Публичный ключ (его можно показывать): `Get-Content $HOME\.ssh\trafaret_staging.pub`. Эту строку добавляют в `~/.ssh/authorized_keys` пользователя `trafaret`.
4. Закрытый ключ копируется в буфер, на экран не выводится: `Get-Content $HOME\.ssh\trafaret_staging -Raw | Set-Clipboard`. Его вставляешь только в секрет GitHub `STAGING_SSH_KEY`, больше никуда.

Вместо ключа можно дать пароль пользователя в секрете `STAGING_SSH_PASSWORD`, если на сервере разрешён вход по паролю.

**2. База данных**
1. FastPanel → «Базы данных» → «Создать», тип **PostgreSQL**, владелец `trafaret`.
2. Имя базы `trafaret_test`, пользователь `trafaret_test`, придумай пароль (пароль 2).

**3. Два сайта (поддомены)**
1. FastPanel → «Сайты» → «Создать сайт» → `test.trafaret-line.com.ua`, владелец `trafaret`.
2. В настройках сайта выбери проксирование (reverse proxy) на `http://127.0.0.1:3110`.
3. Так же второй сайт `api-test.trafaret-line.com.ua` с проксированием на `http://127.0.0.1:9110`. Для него разреши загрузку файлов до 50 МБ (`client_max_body_size 50m`): покупатели загружают макеты.
4. Для обоих включи SSL Let's Encrypt.
5. Если DNS домена не в FastPanel: у регистратора добавь две A-записи `test` и `api-test` на IP сервера.

**4. Секреты в GitHub**
GitHub → репозиторий `trafaret-line` → Settings → Secrets and variables → Actions → New repository secret. Семь штук:

| Имя | Что вписать |
| --- | --- |
| `STAGING_SSH_HOST` | IP сервера |
| `STAGING_SSH_USER` | `trafaret` |
| `STAGING_SSH_KEY` | закрытый ключ из шага 1.4 (вставить из буфера целиком) |
| `STAGING_DB_NAME` | `trafaret_test` |
| `STAGING_DB_USER` | `trafaret_test` |
| `STAGING_DB_PASSWORD` | пароль 2 |
| `STAGING_PASSWORD` | новый пароль 3: для входа на тестовый сайт и в админку |

Если SSH на сервере не на порту 22, на той же странице во вкладке Variables добавь `STAGING_SSH_PORT`. Там же можно поменять домены (`STAGING_SITE_DOMAIN`, `STAGING_API_DOMAIN`) и порты (`STAGING_WEB_PORT`, `STAGING_API_PORT`), если 3110 или 9110 заняты.

**5. Первый запуск**
GitHub → Actions → Staging → Run workflow. Дальше всё само после каждого слияния.

**Вход**
- Сайт: логин `trafaret`, пароль 3.
- Админка `https://api-test.trafaret-line.com.ua/app`: почта `admin@trafaret-line.com.ua`, пароль 3 (поменять можно в самой админке).

## Как это устроено

1. `ensure-secrets.sh` создаёт на сервере папки и один раз внутренние секреты (сессии магазина, токен «магазин → сайт», публичный ключ витрины) в `~/trafaret-staging/shared/secrets.env`. Наружу уходит только публичный ключ витрины: он и так виден в JavaScript сайта.
2. Сборка идёт на машине GitHub, а не на сервере, чтобы не грузить его: магазин (`medusa build`) и сайт (`next build` в режиме standalone с адресами тестовых поддоменов).
3. `rsync` копирует сборку в `~/trafaret-staging/incoming`, настройки из секретов GitHub уходят через SSH в `shared/deploy.env` (права 600).
4. `deploy.sh` на сервере: ставит Node.js 22 и pm2 в `~/trafaret-staging/tools` (первый раз), пакеты магазина, миграции базы, `staging-setup.ts` (на пустой базе — регион, доставка, демо-товары; публичный ключ витрины), логин админки. Затем меняет старую сборку на новую и ждёт ответа магазина (`/health`) и сайта. Если не отвечают, возвращает прошлую сборку, и запуск в Actions краснеет.
5. Фото товаров и загрузки покупателей лежат в `~/trafaret-staging/shared` и переживают обновления. После перезагрузки сервера pm2 поднимает процессы сам (`@reboot` в crontab пользователя).

Полезное на сервере (под пользователем `trafaret`):

```bash
export PM2_HOME=~/trafaret-staging/tools/pm2-home PATH=~/trafaret-staging/tools/node/bin:$PATH
~/trafaret-staging/tools/pm2/node_modules/.bin/pm2 status
~/trafaret-staging/tools/pm2/node_modules/.bin/pm2 logs tl-staging-backend --lines 100
```

## Каталог

Первая выкладка показывает сайт, все конструкторы и демо-товары из `seed-trafaret.ts`. Полный каталог с фото (741 товар, 1,6 ГБ фото) в git не хранится, его загрузка на тестовый сервер — следующий шаг.
