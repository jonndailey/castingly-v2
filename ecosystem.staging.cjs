/**
 * PM2 ecosystem for Castingly v2 (staging/dev server)
 * - Runs Next.js in production mode on port 3003
 * - Uses .env.staging to point at dev DB + dev Core/DMAPI
 */

module.exports = {
  apps: [
    {
      name: 'castingly-v2-staging',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env_file: '.env.staging',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      watch: false,
      time: true,
      error_file: '/home/jonny/.pm2/logs/castingly-v2-staging-error.log',
      out_file: '/home/jonny/.pm2/logs/castingly-v2-staging-out.log',
      log_file: '/home/jonny/.pm2/logs/castingly-v2-staging.log',
    }
  ]
}

