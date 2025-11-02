require('dotenv').config();
const mongoose = require('mongoose');

async function fixDateFormat() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    const db = mongoose.connection.db;
    const collection = db.collection('classschedules');

    // Find all schedules with date in $date format
    const allSchedules = await collection.find({}).toArray();
    console.log(`Total schedules found: ${allSchedules.length}`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const schedule of allSchedules) {
      try {
        // Check if date is in the problematic format
        if (schedule.date && typeof schedule.date === 'object' && schedule.date.$date) {
          const correctDate = new Date(schedule.date.$date);
          
          console.log(`Fixing schedule ${schedule._id}: ${schedule.subject}`);
          console.log(`  Old date format:`, schedule.date);
          console.log(`  New date format:`, correctDate);

          // Update the document
          await collection.updateOne(
            { _id: schedule._id },
            { $set: { date: correctDate } }
          );
          
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error fixing schedule ${schedule._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} schedules`);
    if (errorCount > 0) {
      console.log(`❌ ${errorCount} errors encountered`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDateFormat();
