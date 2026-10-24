module.exports = {
  apps: [
    {
      name: 'portal-prod',
      script: 'scripts/portal-server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
    ,
    {
      name: 'deploy-trigger',
      script: 'node',
      args: 'scripts/deploy-server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        // Set DEPLOY_TOKEN in your environment before starting PM2
        DEPLOY_TOKEN: process.env.DEPLOY_TOKEN || '',
        DEPLOY_SERVER_PORT: 4000
      }
    }
  ]
};
