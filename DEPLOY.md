# 部署说明（服务器）

AI 命题系统 Demo 的前后端部署步骤。本地开发也适用。

## 环境要求

- Python 3.10+
- Node.js 18+（仅构建前端需要）
- 一个有效的 DeepSeek API Key

## 1. 拉取代码

```bash
git clone <你的仓库地址>
cd exam-demo
```

## 2. 后端

```bash
cd backend
pip install -r requirements.txt

# 创建配置文件（.env 不在 git 中，需手动创建）
cp ../.env.example .env
# 编辑 backend/.env，填写：
#   DEEPSEEK_API_KEY=sk-xxx            ← 必填，你的真实 Key
#   DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
#   DEEPSEEK_MODEL=deepseek-v4-pro
#   SECRET_KEY=<一段随机字符串>         ← 生产环境务必改成随机值，勿用默认值

# 启动（生产建议去掉 --reload，用 0.0.0.0 对外）
uvicorn main:app --host 0.0.0.0 --port 8001
```

后端运行在 `http://<服务器IP>:8001`，接口文档在 `http://<服务器IP>:8001/docs`。

> 注意：后端端口是 **8001**（前端 `client.ts` 里写的是 8001），不是 README 里旧的 8000。

## 3. 前端

前端需要能访问后端 API，二选一：

### 方案 A：直接改 API 地址（简单）

编辑 `frontend/src/api/client.ts` 第 3 行：

```ts
const BASE = 'http://<服务器IP>:8001/api'
```

然后构建：

```bash
cd frontend
npm install
npm run build        # 产物在 frontend/dist/
```

用任意静态服务器托管 `dist/`（如 nginx、`python -m http.server`、`npx serve`）。

### 方案 B：nginx 反向代理（推荐，避免跨域）

保持前端 `BASE` 为相对地址或同域，用 nginx 把 `/api` 反代到后端：

```nginx
server {
    listen 80;
    server_name <你的域名>;

    # 前端静态文件
    root /path/to/exam-demo/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反代
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

若用反代，`client.ts` 里的 `BASE` 可改为 `'/api'`（相对路径）。

## 4. 首次使用

1. 打开前端地址 → 注册页（`/register`）创建账号，教师角色拥有完整功能。
2. 数据库 `backend/exam.db` 会在首次启动时自动创建（用户、试卷、班级、考试均落库持久化）。

## 重要提醒

- **`.env` 已被 `.gitignore` 忽略**，不会进入 git；服务器上必须手动创建并填写真实 Key 和随机 `SECRET_KEY`。
- **`uploads/` 与 `*.db` 同样被忽略**，属运行时数据，不随代码走。
- `SECRET_KEY` 默认值为 `dev-secret-key-change-me`，生产环境务必替换，否则 JWT 可被伪造。
- 若服务器无法访问外网 DeepSeek API，命题/生成功能会失败，请确保出网可用。
