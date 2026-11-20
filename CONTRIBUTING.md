# Contributing

Pull requests run quality checks for the frontend, primary backend, hooks, processor, and worker services. Each service is checked for linting, formatting, unit tests with coverage, TypeScript errors, and a production build.

Before opening a pull request, run the relevant service's `npm run lint`, `npm run format:check`, `npm run test:ci`, `npm run typecheck`, and `npm run build` commands. The CI unit-test containers run without network access, so tests should mock external services instead of relying on PostgreSQL, Kafka, SMTP, or public APIs.
