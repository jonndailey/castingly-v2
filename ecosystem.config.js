module.exports = {
  apps: [
    {
      name: 'castingly-v2',
      script: 'npm',
      args: 'run start',
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
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/jonny/.pm2/logs/castingly-v2-error.log',
      out_file: '/home/jonny/.pm2/logs/castingly-v2-out.log',
      log_file: '/home/jonny/.pm2/logs/castingly-v2.log',
      time: true,
      autorestart: true,
      restart_delay: 1000
    }
  ]
};
