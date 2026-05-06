import mongoose from "mongoose";
import 'dotenv/config'; // Load environment variables

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    // Connection options for better reliability with MongoDB Atlas
    const options = {
      serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000, // Increased timeout for initial connection
      retryWrites: true,
      w: 'majority',
      // Additional options for Atlas
      tls: true,
      tlsAllowInvalidCertificates: false,
    };

    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    
    // Try SRV connection first
    let conn;
    try {
      conn = await mongoose.connect(process.env.MONGODB_URI, options);
    } catch (srvError) {
      // If SRV fails, try converting to direct connection
      if (srvError.message.includes('ENOTFOUND') || srvError.message.includes('querySrv')) {
        console.warn('⚠️ SRV connection failed, this might indicate:');
        console.warn('   - Cluster is paused or deleted');
        console.warn('   - Network/DNS issues');
        console.warn('   - Incorrect cluster name in connection string');
        throw new Error(`MongoDB Atlas connection failed: ${srvError.message}\n\nPlease verify:\n1. Your MongoDB Atlas cluster is running (not paused)\n2. The cluster name in your connection string is correct\n3. Your IP address is whitelisted in Atlas Network Access\n4. You have internet connectivity`);
      }
      throw srvError;
    }
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB Atlas');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from MongoDB Atlas');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed through app termination');
      process.exit(0);
    });
    
    // IMPORTANT: For cookies to work in development, run both frontend and backend on the same domain (localhost) and set 'secure: false' for cookies.
    
    return conn;
  } catch (error) {
    console.error("\n❌ Database connection failed:", error.message);
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
      console.error("\n📋 MongoDB Atlas Troubleshooting Checklist:");
      console.error("   1. ✅ Check your internet connection");
      console.error("   2. ✅ Verify MongoDB Atlas cluster is running (not paused)");
      console.error("      → Go to MongoDB Atlas → Clusters → Check if cluster shows 'Paused'");
      console.error("   3. ✅ Check IP whitelist in MongoDB Atlas");
      console.error("      → Go to Network Access → Add your IP or allow 0.0.0.0/0 (for testing)");
      console.error("   4. ✅ Verify database user credentials");
      console.error("      → Go to Database Access → Check username/password");
      console.error("   5. ✅ Verify connection string in .env file");
      console.error("      → Get fresh connection string from Atlas → Connect → Connect your application");
      console.error("   6. ✅ Check if cluster name matches connection string");
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error("\n🔍 DNS Resolution Error Detected:");
      console.error("   The cluster domain cannot be resolved. This usually means:");
      console.error("   - The cluster was deleted or paused");
      console.error("   - The cluster name in connection string is incorrect");
      console.error("   - Network/DNS configuration issues");
      console.error("\n💡 Solution:");
      console.error("   1. Log into MongoDB Atlas (https://cloud.mongodb.com)");
      console.error("   2. Check if your cluster exists and is running");
      console.error("   3. If cluster is paused, click 'Resume'");
      console.error("   4. Get a fresh connection string: Clusters → Connect → Connect your application");
      console.error("   5. Update MONGODB_URI in your .env file");
    }
    // Don't exit - let the server continue running
    throw error;
  }
};