# Docker Desktop development

All services run in Linux containers in Docker Desktop. No host Node server, PostgreSQL or Kafka is required.

## Setup

Copy .env.docker.example to the ignored .env.docker file. Set JWT_PASSWORD, CREDENTIAL_ENCRYPTION_KEY and the Resend SMTP credentials. Keep the encryption key stable and privately backed up: changing it makes existing saved connections unreadable.

SMTP_ENDPOINT defaults to smtp.resend.com, SMTP_PORT to 465, and SMTP_USERNAME to resend. SMTP_PASSWORD is your private Resend API key; SMTP_FROM must use a sending domain verified in your Resend account. Compose requires authentication and TLS. Ports 465/2465 use implicit TLS; 587/2587 use STARTTLS. Credentials are supplied to the worker only, never the frontend.

```powershell
docker compose --env-file .env.docker up --watch
```

On the first start, add --build to build the application images. Open http://localhost:8080. Email goes to real inboxes through Resend; Mailpit is no longer included. Change WEB_PORT if occupied.

## Selective updates

Compose Watch syncs frontend app/components/public files and restarts only the affected backend for source changes. Dependency, Dockerfile and Prisma changes rebuild only the affected service. Docker reuses cached dependencies where possible. Keep Watch running for synchronization.

For an explicit source/dependency rebuild:

```powershell
docker compose --env-file .env.docker up -d --build --no-deps worker
```

For SMTP/environment changes only, recreate worker without rebuilding:

```powershell
docker compose --env-file .env.docker up -d --no-deps worker
```

A plain restart does not apply new environment values. Processor and worker have restart: unless-stopped to recover from unexpected process exits while respecting deliberate stops.

## Infrastructure and migrations

Containers connect to postgres:5432 and kafka:9092; these services have no host ports. Browser requests use gateway /api and /hooks. External GitHub/Tally requests need a public HTTPS endpoint such as your ngrok origin.

The db-init task applies primary-backend migrations and safely upserts the trigger/action catalog. Kafka init creates the topic; a one-time volume task sets Kafka ownership. Existing PostgreSQL and Kafka data are in named volumes.

After adding a reviewed migration, rebuild API, apply the migration, and update only affected consumers:

```powershell
docker compose --env-file .env.docker build primary-backend
docker compose --env-file .env.docker run --rm db-init
docker compose --env-file .env.docker up -d --no-deps primary-backend
```

Keep the service Prisma schema copies aligned. Do not reset data volumes to fix migrations.

## Tests and manual verification

Jest unit tests mock external boundaries and run in network-isolated containers. GitHub CI runs all five services with lint, formatting, unit tests/coverage, type checks and production builds. There is no integration/E2E suite.

Use the frontend to create and publish an automation, configure its trigger and actions, and inspect Task history. APP_ENV=development enables Send test event for saved generic Webhook workflows; other/missing values hide it and block its API endpoint. Recreate API after changing that flag, then refresh the browser.

Test events run real saved actions, including real Resend email delivery. Use only recipients and destinations you intend to contact. The old Mailpit-only smoke script has been removed.

## Logs and shutdown

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f worker processor
docker compose --env-file .env.docker down
```

Ordinary down preserves named data volumes. Do not add -v unless deliberately deleting data. This development configuration still uses HTTP, a development frontend and a single Kafka broker; production hardening and EC2/CD are separate work.

## Scaling from .env.docker

The root .env.docker is the control file for Docker Desktop. Service .env files are not required: Compose injects the relevant values into every replica.

| Variable                   | Default | Meaning                                                         |
| -------------------------- | ------- | --------------------------------------------------------------- |
| KAFKA_PARTITIONS           | 1       | Partitions for zap-events; 1-256; existing topics can only grow |
| WORKER_REPLICAS            | 1       | Number of worker containers sharing main-worker                 |
| WORKER_CONCURRENCY         | 1       | Partitions processed concurrently inside each worker; 1-256     |
| PROCESSOR_REPLICAS         | 1       | Number of processors; start with one                            |
| PROCESSOR_BATCH_SIZE       | 50      | Maximum actions selected for dispatch per cycle; 1-1000         |
| PROCESSOR_POLL_INTERVAL_MS | 2000    | Pause after a processor cycle; 100-60000 milliseconds           |
| SCHEDULER_BATCH_SIZE       | 50      | Maximum due schedules selected per cycle; 1-500                 |

Example for three workers:

```env
KAFKA_PARTITIONS=3
WORKER_REPLICAS=3
WORKER_CONCURRENCY=1
PROCESSOR_REPLICAS=1
PROCESSOR_BATCH_SIZE=50
PROCESSOR_POLL_INTERVAL_MS=2000
SCHEDULER_BATCH_SIZE=50
```

After editing the file, with Kafka already running, apply the partition setting first:

```powershell
docker compose --env-file .env.docker run --rm --no-deps kafka-init
```

Only if that succeeds, apply replica counts and runtime settings:

```powershell
docker compose --env-file .env.docker up -d --no-build --no-deps worker processor
```

These commands reuse existing images and do not rebuild or restart PostgreSQL, Kafka, the API, hooks or frontend. The init script creates a missing topic or increases an existing one. A lower count exits with an error and never deletes the topic. Increasing partitions is persistent and may change where new keyed messages are routed. Setting KAFKA_PARTITIONS back to 1 after increasing it to 3 is not supported; keep the real count or higher. You can reduce WORKER_REPLICAS independently.

For a stopped or first-time stack, use the normal full `docker compose --env-file .env.docker up -d` (add --build only for the first image build or source/dependency changes). Full up also applies the environment controls and runs kafka-init before processor/worker startup. Changing the file alone or running compose restart does not apply environment changes.

One partition can feed only one consumer in the shared group. For example, three partitions plus three workers with concurrency one can use all three workers; three partitions plus one worker with concurrency three can instead run those partitions concurrently in one container. More concurrency than available partitions does not add parallelism. Keep the group ID unchanged; different groups each consume the stream independently.

Only partitions/replicas/tuning are configurable here. Kafka topic and worker group stay fixed to avoid accidentally switching streams or replaying work. Kafka replication factor stays one because this stack has one broker. More partitions do not provide broker fault tolerance. Replica changes are manual, not automatic traffic-based scaling. Watch consumer lag, action delay, provider limits, database connections, CPU and RAM before increasing values. Multiple processors use database claims but may contend for the same rows, so throughput does not necessarily increase linearly.
