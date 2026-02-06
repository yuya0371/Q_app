import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// 開発ログをファイルに保存するプラグイン
function devLoggerPlugin(): Plugin {
  const logsDir = path.resolve(__dirname, 'logs')

  // logsディレクトリがなければ作成
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  const getLogFileName = (prefix: string) => {
    const date = new Date().toISOString().split('T')[0]
    return path.join(logsDir, `${prefix}-${date}.log`)
  }

  const appendLog = (prefix: string, entry: string) => {
    const logFile = getLogFileName(prefix)
    fs.appendFileSync(logFile, entry + '\n')
  }

  // ANSIカラーコードを除去
  const stripAnsi = (str: string) => {
    return str.replace(/\x1b\[[0-9;]*m/g, '')
  }

  return {
    name: 'dev-logger',
    configureServer(server) {
      // ブラウザからのログ受信エンドポイント
      server.middlewares.use('/__dev_log', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const logs = JSON.parse(body)
              logs.forEach((log: any) => {
                const timestamp = new Date().toISOString()
                const level = log.level?.toUpperCase() || 'LOG'
                const message = typeof log.message === 'string'
                  ? log.message
                  : JSON.stringify(log.message)
                const entry = `[${timestamp}] [${level}] ${message}`
                appendLog('browser', entry)

                // コンソールにも出力（色付き）
                const colors: Record<string, string> = {
                  ERROR: '\x1b[31m',
                  WARN: '\x1b[33m',
                  INFO: '\x1b[36m',
                  LOG: '\x1b[37m',
                }
                console.log(`${colors[level] || ''}[BROWSER] ${entry}\x1b[0m`)
              })
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end('{"ok":true}')
            } catch (e) {
              res.writeHead(400)
              res.end('Invalid JSON')
            }
          })
        } else {
          res.writeHead(405)
          res.end('Method not allowed')
        }
      })

      // Viteサーバーのエラーをキャプチャ
      server.ws.on('error', (err) => {
        const timestamp = new Date().toISOString()
        appendLog('server', `[${timestamp}] [WS_ERROR] ${err.message}`)
      })

      // SSRエラーをキャプチャ
      server.ssrFix?.on?.('error', (err: Error) => {
        const timestamp = new Date().toISOString()
        appendLog('server', `[${timestamp}] [SSR_ERROR] ${err.message}`)
      })

      // HTTPサーバーエラーをキャプチャ
      server.httpServer?.on('error', (err: Error) => {
        const timestamp = new Date().toISOString()
        appendLog('server', `[${timestamp}] [HTTP_ERROR] ${err.message}`)
      })

      // サーバー起動ログ
      const startEntry = `\n${'='.repeat(60)}\n[${new Date().toISOString()}] Dev server started on http://localhost:3001\n${'='.repeat(60)}`
      appendLog('server', startEntry)
      appendLog('browser', startEntry)
    },

    // ビルドエラーをキャプチャ
    buildStart() {
      const timestamp = new Date().toISOString()
      appendLog('server', `[${timestamp}] [BUILD] Build started`)
    },

    // ビルドエラーをキャプチャ
    buildEnd(error) {
      if (error) {
        const timestamp = new Date().toISOString()
        appendLog('server', `[${timestamp}] [BUILD_ERROR] ${stripAnsi(error.message)}`)
        if (error.stack) {
          appendLog('server', stripAnsi(error.stack))
        }
      }
    },

    // モジュール解決エラーをキャプチャ
    resolveId: {
      order: 'pre',
      handler(source, importer) {
        // エラーハンドリングはViteが行う、ここではパススルー
        return null
      }
    },

    // トランスフォームエラーをキャプチャ
    transform(code, id) {
      // エラーが発生した場合はViteが自動的に処理するので、ここでは何もしない
      return null
    },

    // HMRエラーをキャプチャ
    handleHotUpdate({ file, server, modules }) {
      const timestamp = new Date().toISOString()
      appendLog('server', `[${timestamp}] [HMR] File updated: ${file}`)
      return modules
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devLoggerPlugin()],
  server: {
    port: 3001,
  },
  // エラーオーバーレイを有効化（デフォルト）
  clearScreen: false, // ログが消えないように
})
