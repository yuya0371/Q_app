// 開発環境用ロガー
// console.logをラップして、ファイルにも保存する

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: unknown;
  timestamp: string;
}

const LOG_ENDPOINT = '/__dev_log';
const BATCH_INTERVAL = 1000; // 1秒ごとにバッチ送信
const isDev = import.meta.env.DEV;

class DevLogger {
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };

  constructor() {
    // オリジナルのconsoleメソッドを保存
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };

    if (isDev) {
      this.overrideConsole();
    }
  }

  private overrideConsole() {
    console.log = (...args: unknown[]) => {
      this.originalConsole.log(...args);
      this.addToQueue('log', args);
    };

    console.info = (...args: unknown[]) => {
      this.originalConsole.info(...args);
      this.addToQueue('info', args);
    };

    console.warn = (...args: unknown[]) => {
      this.originalConsole.warn(...args);
      this.addToQueue('warn', args);
    };

    console.error = (...args: unknown[]) => {
      this.originalConsole.error(...args);
      this.addToQueue('error', args);
    };

    // グローバルエラーハンドラー
    window.addEventListener('error', (event) => {
      this.addToQueue('error', [`Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}`]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addToQueue('error', [`Unhandled Promise Rejection: ${event.reason}`]);
    });
  }

  private formatMessage(args: unknown[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  private addToQueue(level: LogLevel, args: unknown[]) {
    this.queue.push({
      level,
      message: this.formatMessage(args),
      timestamp: new Date().toISOString(),
    });

    // バッチ送信のタイマーをセット
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), BATCH_INTERVAL);
    }
  }

  private async flush() {
    if (this.queue.length === 0) {
      this.timer = null;
      return;
    }

    const logs = [...this.queue];
    this.queue = [];
    this.timer = null;

    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs),
      });
    } catch {
      // 送信失敗時は元のキューに戻す（リトライ）
      this.queue = [...logs, ...this.queue];
    }
  }

  // 手動でログを送信
  log(...args: unknown[]) {
    console.log(...args);
  }

  info(...args: unknown[]) {
    console.info(...args);
  }

  warn(...args: unknown[]) {
    console.warn(...args);
  }

  error(...args: unknown[]) {
    console.error(...args);
  }

  // 即時フラッシュ（ページ離脱時など）
  flushSync() {
    if (this.queue.length > 0 && navigator.sendBeacon) {
      navigator.sendBeacon(LOG_ENDPOINT, JSON.stringify(this.queue));
      this.queue = [];
    }
  }
}

// シングルトンインスタンス
export const devLogger = new DevLogger();

// ページ離脱時にログをフラッシュ
if (isDev) {
  window.addEventListener('beforeunload', () => {
    devLogger.flushSync();
  });
}
