module.exports = {
  apps: [
    {
      name: 'castingly-v2-dev',
      script: 'npm',
      args: 'run dev:tailscale',
      cwd: '/home/jonny/apps/castingly-v2',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      ignore_watch: [
        'node_modules',
        '.next',
        '.git',
        'logs'
      ],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4874,
        WATCHPACK_POLLING: 'true',
        WATCHPACK_POLLING_INTERVAL: '1000',
        DMAPI_BASE_URL: 'http://localhost:4100',
        DAILEY_CORE_AUTH_URL: 'http://100.105.97.19:3002',
        DMAPI_APP_ID: 'castingly',
        DMAPI_SERVICE_EMAIL: 'dmapi-service@castingly.com',
        DMAPI_SERVICE_PASSWORD: 'castingly_dmapi_service_2025',
        DMAPI_LIST_USER_ID: 'test-user-id'
      },
      error_file: '/home/jonny/.pm2/logs/castingly-v2-dev-error.log',
      out_file: '/home/jonny/.pm2/logs/castingly-v2-dev-out.log',
      log_file: '/home/jonny/.pm2/logs/castingly-v2-dev.log',
      time: true,
      autorestart: true,
      restart_delay: 1000
    }
  ]
};
