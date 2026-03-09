#!/bin/sh
# Generate openclaw.json from environment variables at container start.
# Uses Node.js for JSON generation to avoid shell string-escaping issues.
set -e

node - << 'NODEOF'
const fs   = require('fs');
const path = '/home/node/.openclaw/openclaw.json';

fs.mkdirSync('/home/node/.openclaw', { recursive: true });

const config = {
  gateway: {
    auth: {
      mode:     'password',
      password: process.env.OPENCLAW_GATEWAY_PASSWORD || 'WRZJvFTw3-wdf222Fk96nw',
    },
    controlUi: {
      dangerouslyAllowHostHeaderOriginFallback: true,
      dangerouslyDisableDeviceAuth: true,
    },
  },
};

const hooksToken = process.env.OPENCLAW_HOOKS_TOKEN;
if (hooksToken) {
  config.gateway.hooks = {
    enabled: true,
    token:   hooksToken,
    mappings: [
      {
        id:              'sms',
        match:           { path: 'sms' },
        action:          'agent',
        wakeMode:        'now',
        name:            'SMS from {{From}}',
        sessionKey:      'hook:sms:{{From}}',
        messageTemplate: 'Incoming SMS from {{From}}:

{{Body}}',
      },
    ],
  };
}

fs.writeFileSync(path, JSON.stringify(config, null, 2));
console.log('openclaw.json written to', path);
NODEOF

exec "$@"
