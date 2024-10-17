import http from 'http';
import { Server } from 'socket.io';
import Course from '../Models/courseModel.js';
export const socketServer = http.createServer();
export const io = new Server(socketServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});
 
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Join a specific room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    // Emit the updated participant count to the room
    const participantsCount = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit('updateParticipantCount', { count: participantsCount });
  });
 
  // Listen for messages sent to a specific room
  socket.on('sendMessage', (messageData) => {
    const { room, text, timestamp } = messageData;
    if (room && text) {
      io.to(room).emit('receiveMessage', messageData); // Broadcast to the room only
      console.log(`Message sent to room ${room} at ${timestamp}: ${text}`);
    } else {
      console.error('Message or room is missing!');
    }
  });

  // Start live stream
  socket.on('start-live', async (courseId) => {
    console.log("instructor start-live")
    await Course.findByIdAndUpdate(courseId, { isLive: true, liveStreamStatus: 'live' });
    io.to(courseId).emit('live-status-changed', { courseId, isLive: true });
  });

  // Stop live stream
  socket.on('stop-live', async (courseId) => {
    console.log("instructor stop-live")
     await Course.findByIdAndUpdate(courseId, { isLive: false, liveStreamStatus: 'ended' });
    io.to(courseId).emit('live-status-changed', { courseId, isLive: false });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);

    // Emit the updated participant count to all rooms the socket was in
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        const participantsCount = io.sockets.adapter.rooms.get(room)?.size || 0;
        io.to(room).emit('updateParticipantCount', { count: participantsCount });
      }
    }
  });
});
