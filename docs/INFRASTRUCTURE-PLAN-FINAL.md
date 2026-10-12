# INFRASTRUCTURE-PLAN-FINAL — обязательный переход на автономный VPS

Статус: AUTHORITATIVE MIGRATION PLAN — PRIORITY 1
Дата обновления: 2026-10-12
Связан с: ПЛАН-ФИНАЛ — Full Audit & Repair

## ПРИОРИТЕТ № 1 — ПОЛНОСТЬЮ УБРАТЬ ВНЕШНИЕ RUNTIME/DATABASE-ПЛАТФОРМЫ

**Обязательное целевое состояние репозитория Crypto: VPS + Docker Compose + PostgreSQL 16 + Caddy. В завершённом репозитории не должно остаться зависимостей от Cloudflare и Neon ни в коде, ни в конфигурациях, package manifests, workflows/secrets references, deployment, документации и инструкциях.**

Это решение принято и не является предметом повторного обсуждения. Все остальные задачи выполняются с учётом этого приоритета. Переход проводится безопасно: сначала готовятся и тестируются VPS API/worker, PostgreSQL, миграции, backup/restore, CI/CD и rollback; затем выполняется контролируемый cutover; после проверки удаляются все оставшиеся legacy-компоненты и ссылки. До отдельного подтверждения не выполнять production cutover, не менять production secrets и не запускать production ingestion.

## 0. Текущий baseline и обязательный результат

Текущие компоненты перечислены ниже только для инвентаризации и удаления. Это не рекомендация их сохранять. Цель — полностью заменить их целевым VPS-стеком.

По текущему репозиторию подтверждено:
- API работает как Cloudflare Worker: `workers/crypto-api/wrangler.toml`.
- API использует `@neondatabase/serverless` и `DATABASE_URL`.
- CI применяет SQL migrations напрямую к Neon через `psql` и secret `NEON_DATABASE_URL`.
- Основная схема БД находится в `infrastructure/postgres/migrations/`.
- Текущий deployment/migration контур завязан на Cloudflare Workers + Neon PostgreSQL.

**Решение окончательное: переход на VPS — приоритет № 1 и начинается сейчас параллельно с безопасной проверкой целевого runtime.** Product Contour v1 аудит продолжается после/параллельно с инфраструктурными работами без расширения числа активов.

---

## 1. Что сейчас реально используется

### 1.1 Cloudflare

Подтверждено:
- `workers/crypto-api/wrangler.toml`
- Worker name: `crypto-api`
- entrypoint: `workers/crypto-api/src/index.ts`
- runtime compatibility date: `2026-09-20`

Следовательно, API сейчас рассчитан на Cloudflare Workers.

### 1.2 Neon

Подтверждено:
- `workers/crypto-api/src/index.ts` импортирует `@neondatabase/serverless`.
- API получает `DATABASE_URL` из environment.
- `.github/workflows/apply-neon-v2.yml` использует secret `NEON_DATABASE_URL`.
- CI устанавливает PostgreSQL client и выполняет migrations через `psql`.

Следовательно, Neon является текущим PostgreSQL backend, а не просто историческим названием каталога.

### 1.3 GitHub Actions

Текущий migration workflow:
`/.github/workflows/apply-neon-v2.yml`

Он:
1. запускается после изменений migrations/workflow;
2. получает `NEON_DATABASE_URL`;
3. устанавливает `postgresql-client`;
4. применяет migrations;
5. выполняет contract checks по DB.

Это важная часть текущей инфраструктуры и должна быть перенесена/переписана при смене DB.

---

## 2. Что Cloudflare сейчас делает

Подтвержденная роль:
- execution/runtime для `crypto-api`;
- HTTP API endpoint;
- доступ к environment variables;
- выполнение serverless TypeScript runtime.

Не подтверждено текущим репозиторием:
- Cloudflare Pages;
- Cloudflare R2;
- KV;
- Durable Objects;
- Queues;
- Cron Triggers;
- Cloudflare Access;
- Cloudflare DNS;
- Cloudflare CDN/WAF как обязательная часть приложения.

Эти пункты нельзя считать используемыми без отдельной проверки account/configuration.

---

## 3. Что Neon сейчас делает

Подтвержденная роль:
- PostgreSQL database;
- хранение Asset Registry;
- Market Registry;
- market history;
- Research Engine;
- Monitoring;
- observations/sources/events;
- migrations и schema contract.

Database schema является центральной частью приложения.

---

## 4. Зависимости, которые нужно убрать при миграции

### API

Сейчас:
`@neondatabase/serverless` → Neon.

После миграции:
`pg` / стандартный PostgreSQL client → локальный PostgreSQL.

Важно: SQL-модель в основном можно сохранить. Переписывать весь data layer не нужно.

### Runtime

Сейчас:
Cloudflare Worker.

После миграции:
обычный Node.js process за reverse proxy.

Предпочтительно:
- Node.js;
- TypeScript;
- Docker;
- один API container.

### CI

Сейчас:
GitHub Actions → Neon.

После миграции:
GitHub Actions → SSH/deploy → VPS,
а migrations выполняются на VPS против локального PostgreSQL.

---

## 5. Что можно оставить почти без изменений

Можно сохранить:
- SQL migrations;
- PostgreSQL schema;
- Research Engine;
- Asset Registry;
- Market Registry;
- API routes;
- research contracts;
- monitoring contracts;
- GitHub repository;
- GitHub Actions;
- TypeScript;
- Binance integration;
- API response contracts.

Это важный вывод: миграция должна быть **инфраструктурной**, а не переписыванием Crypto.

---

## 6. Что потребуется изменить

### P1 — API runtime

Перенести:
`workers/crypto-api/src/index.ts`

из Cloudflare Worker runtime в Node HTTP server.

В идеале сохранить существующие handlers/routes.

### P1 — DB driver

Заменить:
`@neondatabase/serverless`

на PostgreSQL driver, например `pg`.

Сохранить SQL queries и contract.

### P1 — environment

Вместо Cloudflare environment:
- `DATABASE_URL`
- `ADMIN_TOKEN`
- другие реальные secrets после полного inventory.

Secrets не коммитить.

### P1 — deployment

Создать Docker image API.

### P1 — database

Поднять PostgreSQL 16 в Docker с persistent volume.

### P1 — reverse proxy

Использовать Caddy или Nginx.

Предпочтение для простоты:
**Caddy** — automatic HTTPS.

---

## 7. Целевая архитектура

```
Internet
   |
   v
Caddy
HTTPS :443
   |
   v
Crypto API
Node.js / TypeScript
   |
   v
PostgreSQL 16
persistent volume

        ^
        |
     Worker
 scheduled jobs / ingestion
```

GitHub Actions:

```
GitHub
  |
  v
CI
  |
  +--> tests / contract checks
  |
  +--> SSH deploy
          |
          v
        VPS
```

---

## 8. Рекомендуемый VPS

Минимум:
- 4 vCPU
- 8 GB RAM
- 100–160 GB NVMe
- Ubuntu 24.04 LTS
- 1 Gbit/s
- IPv4
- IPv6 желательно
- snapshots
- возможность автоматических backups

Комфортный вариант:
- 8 vCPU
- 16 GB RAM
- 200 GB NVMe

Для текущего личного проекта 4 vCPU / 8 GB должно быть достаточно с запасом, если база не разрастется резко.

---

## 9. Docker Compose

Предварительный состав:

```yaml
services:
  caddy:
  api:
  worker:
  postgres:
```

Опционально позднее:
- backup job;
- monitoring;
- Redis — только если появится реальная потребность.

**Не добавлять Redis заранее.**

---

## 10. PostgreSQL

Целевой PostgreSQL:
**16**

Требования:
- persistent Docker volume;
- migrations;
- регулярный backup;
- restore test;
- отдельный database user для application;
- отдельный privileged user для maintenance/migrations;
- no public PostgreSQL port.

PostgreSQL должен быть доступен только внутри Docker network.

---

## 11. Backups

Минимальная схема:

- daily database backup;
- retention 7–14 days;
- weekly full backup;
- backup хранить не только на VPS;
- периодически проверять restore.

Ключевое правило:

**backup, который никогда не восстанавливался, не считается доказанным backup.**

---

## 12. Migration strategy без потери данных

Не делать:

> выключили Neon → подняли VPS → надеемся, что всё приехало.

Делать:

### Phase 1 — prepare

1. VPS.
2. Docker.
3. PostgreSQL.
4. API container.
5. migrations.
6. backup/restore test.

### Phase 2 — copy

1. Сделать полный dump Neon.
2. Restore на VPS.
3. Проверить row counts.
4. Проверить ключевые constraints.
5. Проверить Asset Registry.
6. Проверить Market Registry.
7. Проверить ETH Asset Card.
8. Проверить API.

### Phase 3 — dual validation

Сравнить:
- schema;
- assets;
- market_pairs;
- research;
- monitoring;
- history;
- API responses.

### Phase 4 — cutover

1. Короткое окно записи.
2. Final dump.
3. Final restore/sync.
4. Переключить API на VPS.
5. Проверить health/API/E2E.
6. Только после этого считать Neon legacy.

### Phase 5 — rollback

Neon не удалять сразу.

Оставить его как rollback source на согласованный период.

Executable gated checklist: [`NEON-TO-POSTGRES-MIGRATION-RUNBOOK.md`](./NEON-TO-POSTGRES-MIGRATION-RUNBOOK.md). It is preparation only and does not authorize a production migration or cutover.

---

## 13. Что обязательно проверить до миграции

### Cloudflare inventory

Проверить в account:
- Workers;
- routes;
- custom domains;
- environment variables;
- secrets;
- Cron;
- KV;
- R2;
- Queues;
- Durable Objects;
- Pages;
- Access;
- DNS.

### Neon inventory

Проверить:
- databases;
- branches;
- roles;
- extensions;
- connection strings;
- pooling;
- compute/autosuspend;
- backups;
- retention;
- current schema;
- current row counts.

Репозиторий не может доказать account-level configuration. Это отдельный infrastructure audit.

---

## 14. Почему VPS подходит Crypto

Для текущей архитектуры преимущества:

1. Один сервер вместо Cloudflare + Neon.
2. PostgreSQL локально.
3. Нет serverless-specific DB driver.
4. Нет vendor-specific runtime.
5. Worker можно запускать как обычный process/container.
6. Migrations становятся обычным PostgreSQL workflow.
7. Проще локальная диагностика.
8. Проще backup/restore.
9. Меньше архитектурных границ.

Минусы:
- backup/security становятся нашей ответственностью;
- VPS может упасть;
- нужно самостоятельно обновлять ОС/Docker;
- нужен monitoring;
- HTTPS/reverse proxy нужно настроить.

Для личного проекта эти минусы приемлемы при нормальном backup discipline.

---

## 15. Ограничения и порядок безопасного перехода

Не делать до готовности и явного подтверждения cutover:
- не переключать production API на VPS вслепую;
- не удалять текущий источник данных до проверки dump/restore и rollback;
- не менять production secrets;
- не запускать production ingestion для тестирования;
- не менять database schema без необходимости.
- не добавлять Redis без необходимости;
- не усложнять Kubernetes;
- не делать multi-server architecture.

---

## 16. Migration Batch — PRIORITY 1, выполнять сейчас

### INFRA-BATCH-1

1. Docker foundation.
2. PostgreSQL 16.
3. Backup/restore.
4. Node API runtime.
5. PostgreSQL driver.
6. Worker container.
7. Caddy.
8. CI/CD deployment.
9. Smoke/E2E checks.
10. Controlled cutover.
11. Rollback window.
12. Удалить все runtime-, database-, CI/CD-, config-, dependency- и documentation-ссылки на Cloudflare/Neon после успешного cutover и подтверждения rollback window.
13. Провести финальный repository-wide scan и удалить все упоминания названий прежних платформ из всего репозитория, включая исторические документы, incident reports и migration runbooks. Итоговый критерий пользователя — в репозитории не должно быть даже словесных упоминаний этих платформ. Финальную зачистку выполнять после переноса и сохранения необходимой операционной информации в нейтральном виде.

---

## 17. Definition of Done инфраструктуры

Миграция считается завершённой только когда:

- [ ] VPS работает стабильно.
- [ ] PostgreSQL восстановлен из dump.
- [ ] Restore test пройден.
- [ ] API работает без Neon.
- [ ] API работает без Cloudflare Workers.
- [ ] Worker работает на VPS.
- [ ] migrations применяются через CI.
- [ ] backups выполняются автоматически.
- [ ] restore подтвержден.
- [ ] HTTPS работает.
- [ ] admin auth работает.
- [ ] Asset Registry совпадает.
- [ ] Market Registry совпадает.
- [ ] ETH Asset Card совпадает.
- [ ] history работает.
- [ ] research работает.
- [ ] monitoring работает.
- [ ] полный E2E проходит.
- [ ] rollback доказан.
- [ ] только после этого Neon/Cloudflare переводятся в legacy/decommission.

---

## 18. Предварительный verdict

**Рекомендация: VPS + Docker Compose + PostgreSQL 16 + Caddy.**

Но это **решение архитектуры, а не команда немедленно мигрировать**.

Следующий правильный шаг:

> FULL INFRASTRUCTURE INVENTORY → окончательная карта зависимостей → VPS sizing → migration batch → перенос.

Это должно идти внутри общего ПЛАН-ФИНАЛ, а не отдельными хаотичными исправлениями.
