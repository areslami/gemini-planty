module.exports = {
  lintOnSave: false, // Keep this line to disable ESLint checks
  devServer: {
    host: '0.0.0.0', // This tells the dev server to listen on all network interfaces
    port: 8080,      // Default Vue dev server port
    client: {
      webSocketURL: 'ws://0.0.0.0:8080/ws', // This explicitly sets the WebSocket URL
    },
    // If you are still behind a proxy, you might also need this:
    // proxy: {
    //   '/api': { // Assuming your backend is at /api
    //     target: 'http://localhost:3000',
    //     ws: true,
    //     changeOrigin: true
    //   }
    // }
  }
};