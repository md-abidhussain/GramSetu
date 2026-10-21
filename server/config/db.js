import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// Some networks cannot resolve the SRV records in an Atlas connection string
// through their own DNS. Opt in with MONGODB_DNS_SERVERS=8.8.8.8,8.8.4.4 rather
// than overriding DNS for the whole process by default.
if (process.env.MONGODB_DNS_SERVERS) {
  const dns = await import('node:dns');
  dns.setServers(process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()));
}

mongoose.set('strictQuery', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15_000
    });
    // The host only: the URI itself contains credentials.
    logger.info('database connected', { host: conn.connection.host });
  } catch (error) {
    logger.error('database connection failed', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;
