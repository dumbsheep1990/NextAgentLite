import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 从环境变量获取配置，提供默认值
  const config = {
    devPort: parseInt(env.VITE_DEV_PORT || '3000', 10),
    devHost: env.VITE_DEV_HOST || '0.0.0.0',
    devOpen: false, // 禁用自动打开浏览器
    apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:8000',
    corsOrigins: env.VITE_CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000',
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: config.devPort,
      host: config.devHost,
      open: config.devOpen,
      // 强制使用IPv4，不监听IPv6
      strictPort: true,
      cors: {
        origin: config.corsOrigins.split(',').map(origin => origin.trim()),
        credentials: env.VITE_CORS_CREDENTIALS === 'true',
      },
      proxy: {
        // 代理API请求到后端服务器
        '/api': {
          target: config.apiBaseUrl,
          changeOrigin: true,
          secure: false,
          ws: true, // 支持 WebSocket
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('代理错误:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              if (env.VITE_ENABLE_DEBUG === 'true') {
                console.log('代理请求:', req.method, req.url);
              }
            });
          },
        },
        // 代理知识图谱服务请求
        '/matgraph': {
          target: env.VITE_MATGRAPH_BASE_URL || 'http://localhost:9622',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/matgraph/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('知识图谱代理错误:', err);
            });
            proxy.on('proxyReq', (_proxyReq, req) => {
              if (env.VITE_ENABLE_DEBUG === 'true') {
                console.log('知识图谱代理请求:', req.method, req.url);
              }
            });
          },
        },
      },
      // 禁用对iframe内容的任何缓存
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    },
    // 环境变量前缀
    envPrefix: 'VITE_',
    // 构建配置
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // 根据环境变量控制构建优化
      minify: mode === 'production',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          // 代码分割配置
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd', '@ant-design/icons'],
            utils: ['axios', 'zustand'],
            charts: ['echarts', 'echarts-for-react'],
            math: ['katex', 'react-katex'],
            viz: ['vis-data', 'vis-network'],
          },
        },
      },
    },
    // 依赖优化配置
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'antd',
        '@ant-design/icons',
        'axios',
        'zustand',
        'react-router-dom',
        'echarts',
        'echarts-for-react',
        'katex',
        'react-katex',
        'swiper',
        'vis-data',
        'vis-network'
      ],
      exclude: []
    }
  }
})
