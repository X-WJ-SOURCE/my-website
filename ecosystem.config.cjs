module.exports = {
  apps: [{
    name: 'my-website',
    script: './node_modules/tsx/dist/cli.mjs',
    args: 'server/main.ts',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      JWT_SECRET: 'change-this-to-a-random-string',
      ADMIN_USER: 'admin',
      ADMIN_PASS: 'change-this-password',
      DATA_DIR: '/home/ubuntu/my-website/data'
    },
    autorestart: true,
    max_memory_restart: '300M',
  }]
}
