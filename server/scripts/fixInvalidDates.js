require('dotenv').config();
const mongoose = require('mongoose');
const ClassSchedule = require('../models/ClassSchedule');

async function fixInvalidDates() {
  try {
    // Connect to MongoDB (let it use default database from URI)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    // Find all schedules
    const allSchedules = await ClassSchedule.find({}).lean();
    console.log(`Total schedules found: ${allSchedules.length}`);

    let invalidCount = 0;
    let fixedCount = 0;
    const invalidSchedules = [];

    // Check each schedule for invalid dates
    for (const schedule of allSchedules) {
      if (!schedule.date) {
        invalidCount++;
        invalidSchedules.push({
          id: schedule._id,
          subject: schedule.subject,
          issue: 'Missing date field'
        });
        console.warn(`⚠️  Schedule ${schedule._id} (${schedule.subject}) has NO date field`);
      } else {
        const dateObj = new Date(schedule.date);
        if (isNaN(dateObj.getTime())) {
          invalidCount++;
          invalidSchedules.push({
            id: schedule._id,
            subject: schedule.subject,
            date: schedule.date,
            issue: 'Invalid date value'
          });
          console.warn(`⚠️  Schedule ${schedule._id} (${schedule.subject}) has INVALID date:`, schedule.date);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total schedules: ${allSchedules.length}`);
    console.log(`   Invalid dates: ${invalidCount}`);
    console.log(`   Valid dates: ${allSchedules.length - invalidCount}`);

    if (invalidCount > 0) {
      console.log(`\n❌ Found ${invalidCount} schedules with invalid dates:`);
      invalidSchedules.forEach(sched => {
        console.log(`   - ${sched.id}: ${sched.subject} - ${sched.issue}`);
      });

      console.log(`\n⚠️  These schedules need to be manually fixed or deleted.`);
      console.log(`\nTo delete these invalid schedules, run:`);
      invalidSchedules.forEach(sched => {
        console.log(`   db.classschedules.deleteOne({_id: ObjectId("${sched.id}")})`);
      });
    } else {
      console.log(`\n✅ All schedules have valid dates!`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixInvalidDates();
