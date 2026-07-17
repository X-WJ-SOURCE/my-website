#!/bin/bash
# 在阿里云服务器上运行此脚本，一键部署

set -e

echo "=== 安装 Node.js ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx

echo "=== 安装全局工具 ==="
sudo npm install -g pm2

echo "=== 克隆项目 ==="
cd /home/ubuntu
if [ -d my-website ]; then
  cd my-website && git pull
else
  git clone https://github.com/X-WJ-SOURCE/my-website.git
  cd my-website
fi

echo "=== 安装依赖 ==="
npm install

echo "=== 构建前端 ==="
npm run build

echo "=== 创建数据目录 ==="
mkdir -p /home/ubuntu/my-website/data/uploads

echo "=== 初始化管理员 ==="
node ./node_modules/tsx/dist/cli.mjs server/seed.ts

echo "=== 启动服务 ==="
pm2 delete my-website 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "=== 配置 Nginx ==="
sudo tee /etc/nginx/sites-available/my-website > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        client_max_body_size 20M;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/my-website /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== 部署完成 ==="
echo "网站运行在: http://$(curl -s ifconfig.me)"
echo "管理后台: http://$(curl -s ifconfig.me)/login"
echo "pm2 命令：pm2 status | pm2 logs | pm2 restart my-website"
