# ⏰ Watchrat 🐀

A simple Telegram bot for sending notifications when websites publish new
content.

## Deployment

The intended way of launching the bot is via Docker. Take a look at
[compose.yml](compose.yml) for an example setup.

## Development setup

### First-time setup

Create application config:

```sh
cp config.template.yml config.yml
```

Now edit the [config.yml](config.yml) according to your requirements. The
application config contains the bulk of application's settings that are related
to the core business logic.

The environment config ([.env](.env)) contains settings that are likely to
change depending on the runtime (Docker, Host machine, etc.)

### Launching

The project can be launched via:

- `main` run config in VS Code
- `deno task main` from the project root
- `docker compose up --build` from the project root
