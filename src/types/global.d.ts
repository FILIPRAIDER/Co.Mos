/**
 * Global Type Declarations
 */

import { Server as SocketIOServer } from 'socket.io';

declare global {
  var io: SocketIOServer | null;
  
  namespace NodeJS {
    interface Global {
      io: SocketIOServer | null;
    }
  }
}

export {};
