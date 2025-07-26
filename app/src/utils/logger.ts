// src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    // 🔧 デバッグ用：本番環境でも全てのログを出力
    // 本番環境では warn と error のみ
    // if (!this.isDevelopment) {
    //   return level === 'warn' || level === 'error';
    // }
    return true; // 👈 すべてのログを出力
  }

  private sanitizeData(data: any): any {
    if (!this.isDevelopment) {
      // 本番環境では機密情報をマスク
      if (typeof data === 'object' && data !== null) {
        const sanitized = { ...data };
        
        // UID をマスク
        if (sanitized.currentUser || sanitized.uid) {
          sanitized.currentUser = sanitized.currentUser ? '***' : undefined;
          sanitized.uid = sanitized.uid ? '***' : undefined;
        }
        
        // 位置情報をマスク
        if (Array.isArray(sanitized.position)) {
          sanitized.position = ['***', '***'];
        }
        
        // ルームIDをマスク
        if (sanitized.roomId) {
          sanitized.roomId = '***';
        }
        
        return sanitized;
      }
    }
    return data;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  // 成功ログ（開発時のみ）
  success(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`✅ ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  // API呼び出しログ（開発時のみ、本番では最小限）
  api(message: string, data?: any): void {
    // 🔧 デバッグ用：本番でも詳細ログを出力
    console.log(`🌐 ${message}`, this.sanitizeData(data));
    
    // if (this.isDevelopment) {
    //   console.log(`🌐 ${message}`, this.sanitizeData(data));
    // } else {
    //   // 本番では成功/失敗のみ
    //   console.log(`🌐 ${message}`);
    // }
  }
}

export const logger = new Logger();