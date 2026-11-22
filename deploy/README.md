# ActionHub EC2 Deployment Plan

Deploy the Next.js frontend on Vercel and run the API, webhook receiver,
processor, worker, PostgreSQL, and Kafka on one EC2 instance. Keep the existing
monorepo and local Compose workflow. The first release requires EC2 access, a
public DNS name for HTTPS, and SMTP credentials. AWS FIS, RDS, MSK, and
CloudFront are optional for this architecture.

## 1. Prepare the repository

| Change                    | Work                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compose.production.yaml` | Define the four backend services, PostgreSQL, Kafka, initialization jobs, and HTTPS gateway. Use persistent volumes, health checks, restart policies, and bounded container logs. Publish only gateway ports. |
| Backend Dockerfiles       | Add production targets that run compiled Node.js output. Keep the development targets for local work and CI. Provide Prisma CLI, migrations, and seed tooling in the database initialization image.           |
| `.env.production.example` | Document DNS, database, JWT, encryption, SMTP, and optional Google OAuth settings. Ignore the real environment file and restrict access on the host. Use production mode and disable development test events. |
| `deploy/Caddyfile`        | Terminate TLS and route `/api/*` to the API and `/hooks/*` to the webhook service. Preserve signed request bodies and headers. Exclude OAuth query strings from access logs.                                  |
| Deployment runbook        | Document first boot, updates, migrations, backup, restore, and rollback. Record the Git commit deployed to EC2 and Vercel.                                                                                    |

Validate the Compose configuration with placeholder values, build all production
targets, and boot a disposable stack. Check that migrations, password migration,
catalog seeding, and Kafka topic creation succeed before dependent services start.

## 2. Configure DNS and the existing Vercel project

| Name                       | Record                              | Destination                                                                                                                     |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `actionhub.jayrana.in`     | As shown by Vercel, typically CNAME | Add the domain to the existing Vercel project and use its exact DNS target.                                                     |
| `api.actionhub.jayrana.in` | A                                   | The new EC2 instance's public IPv4 address. Use an Elastic IP if authorized and you need the address to survive instance stops. |

Use a distinct host for the backend so this deployment needs no edits to the
existing `api.jayrana.in` record. Retain the Resend records below
`actionhub.jayrana.in`, including the DKIM and return-path records. Those
records authenticate outgoing email. Verify `actionhub.jayrana.in` as a
sending domain in Resend and use `notifications@actionhub.jayrana.in` as the
sender. [Resend SMTP settings](https://resend.com/docs/send-with-smtp)

Use the project currently serving `https://actionhub-1-0.vercel.app`. Check
that its production branch is `main` and its root directory is `frontend`.
Add the following Production environment variables and redeploy the reviewed
commit after EC2 is reachable through HTTPS. [Vercel custom domain setup](https://vercel.com/docs/domains/set-up-custom-domain)

| Variable                  | Production value                                    |
| ------------------------- | --------------------------------------------------- |
| `ACTIONHUB_API_ORIGIN`    | `https://api.actionhub.jayrana.in`                  |
| `NEXT_PUBLIC_HOOKS_URL`   | `https://api.actionhub.jayrana.in`                  |
| `NEXT_PUBLIC_BACKEND_URL` | Leave blank or unset to use the same-origin rewrite |

The Next.js rewrite forwards `/api/*` to EC2. Generated generic, GitHub,
and Tally webhook URLs use the EC2 origin directly. If an existing browser
has saved a different GitHub or Tally webhook origin, update that saved
origin and the URL registered with the provider. [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)

For optional Google login and Sheets OAuth, set
`GOOGLE_OAUTH_PUBLIC_URL=https://actionhub.jayrana.in` after the custom domain
is active. Register these two redirect URIs in Google:

- `https://actionhub.jayrana.in/api/v1/oauth/google/login/callback`
- `https://actionhub.jayrana.in/api/v1/oauth/google/sheets/callback`

Use the custom frontend URL for OAuth testing. The API validates a single
frontend origin, so opening the project through its `vercel.app` alias will
fail that origin check once the custom domain is configured.

## 3. Provision and deploy

1. Confirm with the AWS account owner that you can launch an instance, use a
   public subnet, configure or select a security group, and assign a public IP.
   Agree on the AWS region and budget before provisioning. A Linux instance
   with 2 vCPUs, 8 GiB RAM, and a 30 GiB gp3 volume is a starting estimate for
   low traffic. [EC2 launch settings](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-launch-parameters.html)
2. Point `api.actionhub.jayrana.in` at EC2. Allow inbound TCP 80 and 443 and restrict SSH
   to the administrator's IP. Keep PostgreSQL, Kafka, and service ports on the
   Docker network. [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
3. Install Docker and Compose, check out the reviewed commit, and copy
   `.env.production.example` to an ignored `.env.production` file. Restrict
   the file with `chmod 600 .env.production`. Run `openssl rand -hex 32`
   separately for `POSTGRES_PASSWORD`, `JWT_PASSWORD`, and
   `CREDENTIAL_ENCRYPTION_KEY`. Set `SMTP_PASSWORD` to your Resend API key.
   The template uses `smtp.resend.com` on port 465 with TLS.
   Build the images and start the stack using the commands below.
   Confirm that initialization jobs finish and the API and webhook service
   are healthy before routing Vercel traffic to EC2.

```bash
sudo docker compose --env-file .env.production -f compose.production.yaml config --quiet
sudo docker compose --env-file .env.production -f compose.production.yaml up -d --build
sudo docker compose --env-file .env.production -f compose.production.yaml ps -a
curl -fsS https://api.actionhub.jayrana.in/api/v1/trigger/available
```

## 4. Verify the release and recovery

- Check that the Production Compose smoke workflow passes on the release
  commit. It exercises the gateway, API, database, Kafka, and worker against
  a disposable stack without sending email.
- Verify that signup and login throttles behave independently from two
  networks through the live Vercel rewrite. The API relies on a trusted
  proxy for the client IP. If the gateway sees a shared Vercel proxy IP,
  resolve that before opening signup to public traffic.
- Sign up and sign in through Vercel. Create an enabled generic webhook
  workflow, send a JSON event to its EC2 URL, and check the action outcome in
  Task history. Use a destination you control.
- Verify a signed GitHub delivery and a signed Tally delivery. Test Google
  sign-in and Sheets OAuth if those features are enabled.
- Restart the stack and confirm data persists and execution resumes. Take an
  off-instance PostgreSQL backup and test restoring it. Preserve the
  credential encryption key separately so restored provider connections
  remain usable.
- Before future database migrations, take a backup and check schema
  compatibility with the previous release. An image rollback alone cannot
  undo a schema migration.

The single EC2 instance is a shared point of failure. Complete the backup and
restore check before relying on the deployment for live workflows.

### Back up and restore PostgreSQL

On EC2, create a private backup file and copy it to protected storage outside
the instance. The dump contains application data.

```bash
umask 077
sudo docker compose --env-file .env.production -f compose.production.yaml \
  exec -T postgres pg_dump -U actionhub -d actionhub -Fc > actionhub.dump
```

Test the dump in a disposable PostgreSQL 16 instance before treating the
backup as usable. Use `pg_restore --exit-on-error` into an empty database, then
check the workflows and run history through the application. For an upgrade,
record the deployed commit and take the backup before starting the new stack.
For a schema-compatible rollback, check out the previous commit and rebuild.
If the schema is incompatible, stop producers and workers and use the tested
database restore procedure with the previous release.

## 5. Enable continuous delivery to EC2

GitHub builds and tests pushes to `main`. When both **Quality checks and unit
tests** and **Production Compose smoke test** pass on the same commit, open
**Actions → Promote EC2 release → Run workflow** and choose `main`. The
workflow verifies both results for that exact commit and advances the
`production` branch by fast-forward. Use that branch only for releases.

EC2 polls GitHub over outbound HTTPS every five minutes and builds the
approved commit with production Compose. Production secrets stay on EC2,
and SSH remains restricted to the administrator's IP. Vercel continues to
deploy its frontend from `main`.

### Install the timer

From the `ubuntu` account on EC2, with the existing production checkout and
`.env.production` in `~/actionhub`, run this after the first promotion:

```bash
cd ~/actionhub
sudo -n docker info >/dev/null
git fetch --no-tags origin refs/heads/production
install -d ~/.local/bin ~/.config/systemd/user
git show FETCH_HEAD:deploy/pull-release.sh > ~/.local/bin/actionhub-pull-release
git show FETCH_HEAD:deploy/actionhub-deploy.service > ~/.config/systemd/user/actionhub-deploy.service
git show FETCH_HEAD:deploy/actionhub-deploy.timer > ~/.config/systemd/user/actionhub-deploy.timer
sudo loginctl enable-linger "$(id -un)"
systemctl --user daemon-reload
systemctl --user enable --now actionhub-deploy.timer
systemctl --user start actionhub-deploy.service
journalctl --user -u actionhub-deploy.service -n 50 --no-pager
```

Reinstall the script and units from a promoted commit if the CD
implementation changes. The timer skips the currently deployed commit,
serializes deployments, and checks the container state and public HTTPS API.

### Recover an incomplete deployment

The deploy script pauses future deployments after a rollout failure. Start
with the service journal and `docker compose ps -a`. The file
`.git/actionhub-cd/in-progress` records the previous and attempted commits.
If the release changed migrations, the script saves a private PostgreSQL dump
in `.git/actionhub-cd/` before applying the release. Copy required backups
off-instance and prune old local dumps to manage disk usage.

Stop the timer before repairing a release. If the previous image is compatible
with the database, check out the previous commit and rebuild with Compose.
For an incompatible schema, follow the restore procedure above. Remove the
marker and restart the timer only after verifying the recovered stack and
promoting a tested fix. Rollback is manual because some database migrations
cannot be reversed by changing image versions.
