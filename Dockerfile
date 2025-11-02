FROM denoland/deno:2.5.6

# Prefer not to run as root.

USER deno

WORKDIR /app

# Cache the dependencies as a layer

COPY deno.json deno.lock ./
RUN deno task deps:cache

# These steps will be re-run upon each file change in the working directory

COPY --chown=deno:deno . .

CMD ["task", "main"]
