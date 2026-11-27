# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# TeleDrive — production image
#
#   docker build -t teledrive .
#   docker run -p 3000:3000 -v teledrive-data:/data --env-file .env teledrive
#
# Debian slim (not Alpine) on purpose: better-sqlite3 is a native module and
# ships prebuilt binaries for glibc, so nothing has to be compiled at runtime.
# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV npm_config_fund=false npm_config_audit=false

# Toolchain only where it is needed: native modules are built in this stage and
# the resulting node_modules is copied forward, so the runtime image stays small.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build \
	&& npm prune --omit=dev

# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
	PORT=3000 \
	HOST=0.0.0.0 \
	DATA_DIR=/data

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& mkdir -p /data \
	&& chown -R node:node /data

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --chown=node:node server.js healthcheck.js ./

USER node
VOLUME ["/data"]
EXPOSE 3000

# Uses Node's own fetch, so no curl/wget in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD ["node", "healthcheck.js"]

CMD ["node", "server.js"]
