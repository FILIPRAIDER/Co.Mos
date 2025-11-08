import winston from 'winston';

// Configurar formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Crear logger con diferentes niveles según el entorno
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'co-mos-api',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Escribir logs en consola con formato legible
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
        })
      ),
    }),
  ],
});

// En producción, podrías agregar transporte a archivo o servicio externo
if (process.env.NODE_ENV === 'production') {
  // Ejemplo: escribir errores en archivo
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Helper para sanitizar datos sensibles antes de loguear
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitive = ['password', 'passwordHash', 'token', 'apiKey', 'secret'];
  const sanitized: any = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export { logger };
