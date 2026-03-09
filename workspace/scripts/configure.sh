#!/bin/sh
# Generate openclaw.json from environment variables at container start.
# This avoids baking secrets into the Docker image.
set -e

CONFIG_DIR="/home/node/.openclaw"
CONFIG_FILE="$CONFIG_DIR/openclaw.json"

mkdir -p "$CONFIG_DIR"

# Required
GATEWAY_PASSWORD="${OPENCLAW_GATEWAY_PASSWORD:-WRZJvFTw3-wdf222Fk96nw}"
HOOKS_TOKEN="${OPENCLAW_HOOKS_TOKEN:-}"

if [ -z "$HOOKS_TOKEN" ]; then
  # No hooks token — disable hooks
  cat > "$CONFIG_FILE" << JSON
{
  "gateway": {
    "auth": { "mode": "password", "password": "$GATEWAY_PASSWORD" },
    "controlUi": {
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "dangerouslyDisableDeviceAuth": true
    }
  }
}
JSON
else
  # Hooks token present — enable SMS webhook
  cat > "$CONFIG_FILE" << JSON
{
  "gateway": {
    "auth": { "mode": "password", "password": "$GATEWAY_PASSWORD" },
    "controlUi": {
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "dangerouslyDisableDeviceAuth": true
    },
    "hooks": {
      "enabled": true,
      "token": "$HOOKS_TOKEN",
      "mappings": [
        {
          "id": "sms",
          "match": { "path": "sms" },
          "action": "agent",
          "wakeMode": "now",
          "name": "SMS from {{From}}",
          "sessionKey": "hook:sms:{{From}}",
          "messageTemplate": "Incoming SMS from {{From}}:

{{Body}}"
        }
      ]
    }
  }
}
JSON
fi

echo "openclaw.json written to $CONFIG_FILE"
exec "$@"
