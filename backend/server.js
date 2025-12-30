require("dotenv").config();
/**
 * Server Entry Point
 * Starts the Express server
 */
const app = require("./src/app");
const config = require("./src/shared/config/app.config");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🚀 Server đang chạy trên cổng ${PORT}              ║
║                                                    ║
║   📍 API: http://localhost:${PORT}/api              ║
║   📖 Modules loaded:                               ║
║      - Auth, Users, Tours, Hotels                  ║
║      - Flights, Bookings, Destinations             ║
║      - Blogs, Transport, Promotions, Reviews       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});
