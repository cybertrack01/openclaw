#!/usr/bin/env node
// configure.mjs — Generate openclaw.json from env vars at container start, then exec openclaw.
// Pure Node.js: no shell heredocs, no escaping issues.
import { writeFileSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';

const CONFIG_PATH = '/home/node/.openclaw/openclaw.json';
mkdirSync('/home/node/.openclaw', { recursive: true });

const primaryModel = process.env.OPENCLAW_DEFAULT_MODEL || 'anthropic/claude-sonnet-4-6';

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
  agents: {
    defaults: {
      model: {
        primary: primaryModel,
      },
    },
  },
};

const hooksToken = process.env.OPENCLAW_HOOKS_TOKEN;
if (hooksToken) {
  // hooks is a top-level key, not under gateway
  config.hooks = {
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
        messageTemplate: 'Incoming SMS from {{From}}:\n\n{{Body}}',
      },
    ],
  };
}

writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
console.log('[configure] openclaw.json written to', CONFIG_PATH);

const [cmd, ...cmdArgs] = process.argv.slice(2);
console.log('[configure] exec:', cmd, cmdArgs.join(' '));
const result = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
process.exit(result.status ?? 1);