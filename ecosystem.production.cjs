/**
 * PM2 ecosystem for Castingly v2 (production)
 * - Runs Next.js in production mode behind Nginx
 * - Use `.env.production` for build-time NEXT_PUBLIC_* values
 * - Ensure you run `npm ci && npm run build` before starting
 */

module.exports = {
  apps: [
    {
      name: 'castingly-v2',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      // Load runtime environment from .env.production so server-side code
      // (e.g. DB_HOST/DB_USER/DB_PASSWORD) is available to API routes.
      env_file: '.env.production',
      env: {
        NODE_ENV: 'production',
        // Match Apache upstream (proxy) port; .env.production also uses 3003
        PORT: 3003,
      },
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      time: true,
      error_file: '/home/jonny/.pm2/logs/castingly-v2-error.log',
      out_file: '/home/jonny/.pm2/logs/castingly-v2-out.log',
      log_file: '/home/jonny/.pm2/logs/castingly-v2.log'
    }
  ]
}
