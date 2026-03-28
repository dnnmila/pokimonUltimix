// En socketIo.js
let io;

export const init = (socketIoInstance) => {
    io = socketIoInstance;
}

export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}
