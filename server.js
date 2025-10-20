const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Configurar Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Contador de conexiones
  let connectionCount = 0;

  io.on('connection', (socket) => {
    connectionCount++;
    console.log(`🔌 Cliente conectado (ID: ${socket.id}) - Total: ${connectionCount}`);

    // Unirse a canales específicos
    socket.on('join:cocina', () => {
      socket.join('cocina');
      console.log(`👨‍🍳 ${socket.id} se unió a cocina`);
    });

    socket.on('join:servicio', () => {
      socket.join('servicio');
      console.log(`🍽️ ${socket.id} se unió a servicio`);
    });

    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`⚙️ ${socket.id} se unió a admin`);
    });

    // Manejo de órdenes
    socket.on('order:created', (data) => {
      console.log('📝 Nueva orden creada:', data.orderNumber);
      // Notificar a cocina
      io.to('cocina').emit('order:new', data);
      // Notificar a servicio
      io.to('servicio').emit('order:new', data);
      // Notificar a admin
      io.to('admin').emit('order:new', data);
    });

    socket.on('order:updated', (data) => {
      console.log('🔄 Orden actualizada:', data.orderNumber, '→', data.status);
      // Notificar a todos
      io.to('cocina').emit('order:update', data);
      io.to('servicio').emit('order:update', data);
      io.to('admin').emit('order:update', data);
    });

    socket.on('order:statusChanged', (data) => {
      console.log('✅ Estado de orden cambiado:', data.orderNumber, '→', data.status);
      io.to('cocina').emit('order:statusChange', data);
      io.to('servicio').emit('order:statusChange', data);
      io.to('admin').emit('order:statusChange', data);
    });

    // Manejo de sesiones
    socket.on('session:created', (data) => {
      console.log('🆕 Sesión creada:', data.sessionCode);
      io.to('admin').emit('session:new', data);
    });

    socket.on('session:closed', (data) => {
      console.log('🔒 Sesión cerrada:', data.sessionCode);
      io.to('admin').emit('session:close', data);
      io.to('servicio').emit('session:close', data);
    });

    // Manejo de mesas
    socket.on('table:updated', (data) => {
      console.log('🪑 Mesa actualizada:', data.tableNumber);
      io.to('admin').emit('table:update', data);
      io.to('servicio').emit('table:update', data);
    });

    socket.on('table:created', (data) => {
      console.log('➕ Mesa creada:', data.tableNumber);
      io.to('admin').emit('table:new', data);
    });

    socket.on('table:deleted', (data) => {
      console.log('🗑️ Mesa eliminada:', data.tableNumber);
      io.to('admin').emit('table:delete', data);
    });

    // Desconexión
    socket.on('disconnect', () => {
      connectionCount--;
      console.log(`🔴 Cliente desconectado (ID: ${socket.id}) - Total: ${connectionCount}`);
    });
  });

  // Iniciar servidor
  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║            🚀 Co.Mos Server Iniciado                   ║
║                                                        ║
║  📍 Local:    http://${hostname}:${port}                    ║
║  🔌 Socket.io: ACTIVO                                  ║
║  🌐 Modo:     ${dev ? 'DESARROLLO' : 'PRODUCCIÓN'}                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
      `);
    });
});
