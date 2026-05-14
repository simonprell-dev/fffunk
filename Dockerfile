# ── Stage 1: build React app ───────────────────────────────────────────────────
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: runtime with Piper TTS ────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# Piper TTS binary + shared libs
RUN wget -q -O /tmp/piper.tar.gz \
    "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz" \
  && mkdir -p /opt/piper \
  && tar -xzf /tmp/piper.tar.gz -C /opt/piper --strip-components=1 \
  && rm /tmp/piper.tar.gz \
  && chmod +x /opt/piper/piper

# German voice model (thorsten-medium, 22050 Hz)
RUN mkdir -p /app/voices \
  && wget -q -O /app/voices/de_DE-thorsten-medium.onnx \
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx" \
  && wget -q -O /app/voices/de_DE-thorsten-medium.onnx.json \
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json"

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY scripts/ ./scripts/

EXPOSE 3000
CMD ["node", "scripts/server.mjs"]
