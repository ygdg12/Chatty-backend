import 'dotenv/config';
import mongoose from 'mongoose';

async function checkAtlasConnection() {
  console.log('🔍 Checking MongoDB Atlas Connection...\n');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in .env file');
    process.exit(1);
  }

  // Extract cluster info from connection string
  const uri = process.env.MONGODB_URI;
  const clusterMatch = uri.match(/@([^/]+)\.mongodb\.net/);
  const clusterName = clusterMatch ? clusterMatch[1] : 'unknown';
  
  console.log(`📡 Cluster: ${clusterName}`);
  console.log(`🔗 Connection String: ${uri.replace(/:[^:@]+@/, ':****@')}\n`);

  const options = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    retryWrites: true,
    w: 'majority',
  };

  try {
    console.log('🔄 Attempting connection...');
    await mongoose.connect(uri, options);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.error('\n🔍 DNS Resolution Error - The cluster cannot be found.');
      console.error('\n📋 Action Items:');
      console.error('   1. Go to https://cloud.mongodb.com');
      console.error('   2. Check if cluster "' + clusterName + '" exists');
      console.error('   3. If cluster is paused, click "Resume"');
      console.error('   4. If cluster was deleted, create a new one');
      console.error('   5. Get a fresh connection string from Atlas');
    } else if (error.message.includes('authentication')) {
      console.error('\n🔐 Authentication Error - Check your username/password');
    } else if (error.message.includes('IP')) {
      console.error('\n🌐 IP Whitelist Error - Add your IP to Network Access in Atlas');
    }
    
    process.exit(1);
  }
}

checkAtlasConnection();

