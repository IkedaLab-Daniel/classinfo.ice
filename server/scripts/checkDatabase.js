require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    // Connect to MongoDB without specifying dbName
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    console.log('Connected to MongoDB');
    
    // Get database name from connection
    const db = mongoose.connection.db;
    console.log(`Database name: ${db.databaseName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\nCollections (${collections.length}):`);
    collections.forEach(coll => {
      console.log(`  - ${coll.name}`);
    });
    
    // Count documents in each collection
    console.log('\nDocument counts:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`  - ${coll.name}: ${count} documents`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
