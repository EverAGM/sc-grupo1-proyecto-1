const { Pool } = require('pg');
require('dotenv').config();

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isInitialized = false;
    this.initializePool();
  }

  initializePool() {
    const config = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
      maxUses: parseInt(process.env.DB_MAX_USES) || 7500,
      allowExitOnIdle: false,
    };

    // Configuración SSL para producción
    if (process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    this.pool = new Pool(config);
    this.setupEventHandlers();
    this.isInitialized = true;
  }

  setupEventHandlers() {
    this.pool.on('connect', () => {
      console.log('🟢 Conexión establecida con PostgreSQL');
    });

    this.pool.on('error', (err) => {
      console.error('🔴 Error en el pool de conexiones:', {
        error: err.message,
        code: err.code
      });
    });

    this.pool.on('remove', () => {
      console.log('🔌 Cliente removido del pool');
    });
  }

  async query(text, params = []) {
    if (!this.isInitialized) {
      throw new Error('Pool de base de datos no inicializado');
    }

    const startTime = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const executionTime = Date.now() - startTime;
      
      console.log(`📊 Query ejecutada en ${executionTime}ms`, {
        command: result.command,
        rowCount: result.rowCount
      });

      return result;
    } catch (error) {
      console.error('❌ Error en query:', {
        error: error.message,
        code: error.code,
        query: text.substring(0, 100) + '...'
      });
      throw this.formatError(error);
    }
  }

  async getClient() {
    if (!this.isInitialized) {
      throw new Error('Pool de base de datos no inicializado');
    }

    try {
      const client = await this.pool.connect();
      
      // Proxy para manejar la liberación del cliente
      const originalRelease = client.release;
      let isReleased = false;

      client.release = () => {
        if (!isReleased) {
          isReleased = true;
          originalRelease.apply(client);
          console.log('🔌 Cliente liberado correctamente');
        }
      };

      return client;
    } catch (error) {
      console.error('❌ Error obteniendo cliente:', error.message);
      throw this.formatError(error);
    }
  }

  formatError(error) {
    const dbError = new Error(error.message);
    dbError.code = error.code;
    dbError.detail = error.detail;
    dbError.table = error.table;
    dbError.constraint = error.constraint;
    return dbError;
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time');
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: result.rows[0].current_time
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message
      };
    }
  }

  async close() {
    if (this.pool) {
      console.log('🛑 Cerrando pool de conexiones...');
      await this.pool.end();
      this.isInitialized = false;
      console.log('✅ Pool cerrado correctamente');
    }
  }
}

// Instancia única global
const db = new DatabaseConnection();

// Graceful shutdown
const setupGracefulShutdown = () => {
  const shutdown = async (signal) => {
    console.log(`\n${signal} recibido. Cerrando conexiones...`);
    await db.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGQUIT', () => shutdown('SIGQUIT'));
};

// Configurar shutdown graceful
setupGracefulShutdown();

// Exportar instancia única
module.exports = {
  query: (text, params) => db.query(text, params),
  getClient: () => db.getClient(),
  healthCheck: () => db.healthCheck(),
  close: () => db.close(),
  pool: db.pool
};