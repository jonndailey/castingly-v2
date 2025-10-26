module.exports = {
  apps: [
    {
      name: 'castingly-v2-local',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 0.0.0.0 -p 4874',
      cwd: '/home/jonny/apps/castingly-v2',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      // Load local runtime env for API routes (DB, DMAPI, etc.)
      env_file: '.env.local',
      env: {
        NODE_ENV: 'production',
        PORT: 4874,
        ENABLE_LEGACY_AUTH_FALLBACK: 'true',
      },
      error_file: '/home/jonny/.pm2/logs/castingly-v2-local-error.log',
      out_file: '/home/jonny/.pm2/logs/castingly-v2-local-out.log',
      log_file: '/home/jonny/.pm2/logs/castingly-v2-local.log',
      time: true,
      autorestart: true,
      restart_delay: 1000
    }
  ]
}
