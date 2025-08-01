const mongoose = require('mongoose');
require('dotenv').config();

const ClassSchedule = require('../models/ClassSchedule');
const Announcement = require('../models/Announcement');
const Instructor = require('../models/Instructor');
const Department = require('../models/Department');

// Sample data based on your existing sampledata.js
const departments = [
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Department of Mathematics offering various mathematical courses',
    head: 'Dr. Smith',
    location: 'Building A, Floor 1',
    contact: {
      email: 'math@school.edu',
      phone: '+1-555-0101'
    }
  },
  {
    name: 'English',
    code: 'ENG',
    description: 'Department of English Language and Literature',
    head: 'Dr. Johnson',
    location: 'Building B, Floor 2',
    contact: {
      email: 'english@school.edu',
      phone: '+1-555-0102'
    }
  },
  {
    name: 'Science',
    code: 'SCI',
    description: 'Department of General Sciences',
    head: 'Dr. Wilson',
    location: 'Building C, Floor 1',
    contact: {
      email: 'science@school.edu',
      phone: '+1-555-0103'
    }
  },
  {
    name: 'Social Studies',
    code: 'SS',
    description: 'Department of Social Studies and History',
    head: 'Dr. Brown',
    location: 'Building B, Floor 1',
    contact: {
      email: 'socialstudies@school.edu',
      phone: '+1-555-0104'
    }
  },
  {
    name: 'Computer Science',
    code: 'CS',
    description: 'Department of Computer Science and Technology',
    head: 'Dr. Davis',
    location: 'Building D, Floor 3',
    contact: {
      email: 'cs@school.edu',
      phone: '+1-555-0105'
    }
  },
  {
    name: 'Fine Arts',
    code: 'FA',
    description: 'Department of Fine Arts including Art and Music',
    head: 'Prof. Anderson',
    location: 'Building E, Floor 2',
    contact: {
      email: 'finearts@school.edu',
      phone: '+1-555-0106'
    }
  },
  {
    name: 'Physical Education',
    code: 'PE',
    description: 'Department of Physical Education and Sports',
    head: 'Coach Thompson',
    location: 'Sports Complex',
    contact: {
      email: 'pe@school.edu',
      phone: '+1-555-0107'
    }
  }
];

const instructors = [
  {
    name: 'Mr. Reyes',
    email: 'reyes@school.edu',
    department: 'Mathematics',
    office: 'Room 150',
    phone: '+1-555-1001',
    specialization: ['Algebra', 'Calculus', 'Trigonometry'],
    officeHours: 'Monday-Friday 2:00-4:00 PM',
    bio: 'Experienced mathematics instructor with 15 years of teaching experience.'
  },
  {
    name: 'Ms. Cruz',
    email: 'cruz@school.edu',
    department: 'English',
    office: 'Room 160',
    phone: '+1-555-1002',
    specialization: ['Creative Writing', 'Literature', 'Grammar'],
    officeHours: 'Tuesday-Thursday 1:00-3:00 PM',
    bio: 'Published author and creative writing specialist.'
  },
  {
    name: 'Mrs. Santos',
    email: 'santos@school.edu',
    department: 'Science',
    office: 'Room 250',
    phone: '+1-555-1003',
    specialization: ['Physics', 'Chemistry', 'Lab Sciences'],
    officeHours: 'Monday-Wednesday 3:00-5:00 PM',
    bio: 'Former research scientist turned educator with PhD in Physics.'
  },
  {
    name: 'Dr. Garcia',
    email: 'garcia@school.edu',
    department: 'Social Studies',
    office: 'Room 170',
    phone: '+1-555-1004',
    specialization: ['World History', 'American History', 'Government'],
    officeHours: 'Monday-Friday 1:00-2:00 PM',
    bio: 'History professor with extensive knowledge of world civilizations.'
  },
  {
    name: 'Prof. Liu',
    email: 'liu@school.edu',
    department: 'Computer Science',
    office: 'Room 350',
    phone: '+1-555-1005',
    specialization: ['Web Development', 'Programming', 'Software Engineering'],
    officeHours: 'Tuesday-Thursday 10:00 AM-12:00 PM',
    bio: 'Software engineer and full-stack developer with industry experience.'
  },
  {
    name: 'Ms. Rodriguez',
    email: 'rodriguez@school.edu',
    department: 'Fine Arts',
    office: 'Art Studio',
    phone: '+1-555-1006',
    specialization: ['Painting', 'Drawing', 'Art History'],
    officeHours: 'Monday-Wednesday 11:00 AM-1:00 PM',
    bio: 'Professional artist and art educator specializing in traditional media.'
  },
  {
    name: 'Coach Martinez',
    email: 'martinez@school.edu',
    department: 'Physical Education',
    office: 'Gymnasium Office',
    phone: '+1-555-1007',
    specialization: ['Basketball', 'Fitness Training', 'Sports Psychology'],
    officeHours: 'Monday-Friday 7:00-8:00 AM',
    bio: 'Former college basketball player and certified fitness trainer.'
  },
  {
    name: 'Dr. Kim',
    email: 'kim@school.edu',
    department: 'Science',
    office: 'Lab 202',
    phone: '+1-555-1008',
    specialization: ['Organic Chemistry', 'Biochemistry', 'Research Methods'],
    officeHours: 'Tuesday-Thursday 2:00-4:00 PM',
    bio: 'Research chemist with expertise in organic synthesis.'
  },
  {
    name: 'Prof. Johnson',
    email: 'johnson@school.edu',
    department: 'Fine Arts',
    office: 'Music Hall Office',
    phone: '+1-555-1009',
    specialization: ['Classical Music', 'Music Theory', 'Piano'],
    officeHours: 'Monday-Wednesday 9:00-11:00 AM',
    bio: 'Concert pianist and music theory expert.'
  },
  {
    name: 'Prof. Daniel',
    email: 'daniel@school.edu',
    department: 'Computer Science',
    office: 'Room 351',
    phone: '+1-555-1010',
    specialization: ['Web Development', 'JavaScript', 'React'],
    officeHours: 'Evening sessions by appointment',
    bio: 'Web development specialist with focus on modern JavaScript frameworks.'
  }
];

const classSchedules = [
  {
    subject: 'Mathematics',
    instructor: 'Mr. Reyes',
    date: new Date('2025-07-28'),
    startTime: '08:00',
    endTime: '09:30',
    room: 'Room 101',
    description: 'Algebra and Trigonometry - Chapter 5',
    credits: 3,
    department: 'Mathematics',
    capacity: 30,
    enrolledStudents: 25
  },
  {
    subject: 'English',
    instructor: 'Ms. Cruz',
    date: new Date('2025-07-28'),
    startTime: '10:00',
    endTime: '11:30',
    room: 'Room 102',
    description: 'Creative Writing Workshop',
    credits: 2,
    department: 'English',
    capacity: 25,
    enrolledStudents: 20
  },
  {
    subject: 'Science',
    instructor: 'Mrs. Santos',
    date: new Date('2025-07-28'),
    startTime: '13:00',
    endTime: '14:30',
    room: 'Room 201',
    description: 'Physics Lab - Motion and Forces',
    credits: 4,
    department: 'Science',
    capacity: 20,
    enrolledStudents: 18
  },
  {
    subject: 'History',
    instructor: 'Dr. Garcia',
    date: new Date('2025-07-28'),
    startTime: '15:00',
    endTime: '16:30',
    room: 'Room 105',
    description: 'World War II and its Impact',
    credits: 3,
    department: 'Social Studies',
    capacity: 35,
    enrolledStudents: 30
  },
  {
    subject: 'WebDev',
    instructor: 'Prof. Daniel',
    date: new Date('2025-07-28'),
    startTime: '20:00',
    endTime: '22:30',
    room: 'Online',
    description: 'Advanced React Development',
    credits: 2,
    department: 'Computer Science',
    capacity: 15,
    enrolledStudents: 12
  },
  {
    subject: 'Computer Science',
    instructor: 'Prof. Liu',
    date: new Date('2025-07-29'),
    startTime: '09:00',
    endTime: '10:30',
    room: 'Lab 301',
    description: 'Introduction to React.js',
    credits: 3,
    department: 'Computer Science',
    capacity: 20,
    enrolledStudents: 16
  },
  {
    subject: 'Mathematics',
    instructor: 'Mr. Reyes',
    date: new Date('2025-07-29'),
    startTime: '11:00',
    endTime: '12:30',
    room: 'Room 101',
    description: 'Calculus - Derivatives and Applications',
    credits: 3,
    department: 'Mathematics',
    capacity: 30,
    enrolledStudents: 28
  },
  {
    subject: 'Art',
    instructor: 'Ms. Rodriguez',
    date: new Date('2025-07-29'),
    startTime: '14:00',
    endTime: '15:30',
    room: 'Art Studio',
    description: 'Watercolor Painting Techniques',
    credits: 2,
    department: 'Fine Arts',
    capacity: 15,
    enrolledStudents: 12
  },
  {
    subject: 'Physical Education',
    instructor: 'Coach Martinez',
    date: new Date('2025-07-30'),
    startTime: '08:00',
    endTime: '09:30',
    room: 'Gymnasium',
    description: 'Basketball Fundamentals',
    credits: 1,
    department: 'Physical Education',
    capacity: 25,
    enrolledStudents: 22
  },
  {
    subject: 'Chemistry',
    instructor: 'Dr. Kim',
    date: new Date('2025-07-30'),
    startTime: '10:00',
    endTime: '11:30',
    room: 'Lab 202',
    description: 'Organic Chemistry - Reactions',
    credits: 4,
    department: 'Science',
    capacity: 16,
    enrolledStudents: 14
  },
  {
    subject: 'Music',
    instructor: 'Prof. Johnson',
    date: new Date('2025-07-30'),
    startTime: '13:00',
    endTime: '14:30',
    room: 'Music Hall',
    description: 'Classical Music Appreciation',
    credits: 2,
    department: 'Fine Arts',
    capacity: 30,
    enrolledStudents: 25
  }
];

// Sample announcements
const announcements = [
  {
    title: 'Welcome to the New Semester!',
    description: 'Classes will begin on August 5, 2025. Please make sure to check your schedules and prepare all necessary materials. Late enrollment is available until August 10, 2025.',
    postedBy: 'Admin Office'
  },
  {
    title: 'Library Hours Extended',
    description: 'Starting August 15, 2025, the library will be open 24/7 during weekdays to accommodate student study needs. Weekend hours remain 8 AM to 10 PM.',
    postedBy: 'Library Administration'
  },
  {
    title: 'Midterm Examination Schedule',
    description: 'Midterm examinations will be held from September 20-27, 2025. Detailed schedules will be posted on the student portal by September 10. Please check your respective department notices.',
    postedBy: 'Academic Affairs'
  },
  {
    title: 'Campus Wi-Fi Upgrade',
    description: 'The campus network infrastructure will be upgraded on August 12, 2025, from 12 AM to 6 AM. Internet services may be intermittent during this period.',
    postedBy: 'IT Department'
  },
  {
    title: 'Student Organizations Fair',
    description: 'Join us for the annual Student Organizations Fair on August 18, 2025, from 10 AM to 4 PM at the main campus quad. Discover clubs and organizations that match your interests!',
    postedBy: 'Student Affairs'
  },
  {
    title: 'Emergency Contact Update',
    description: 'All students are required to update their emergency contact information through the student portal by August 20, 2025. This is mandatory for enrollment completion.',
    postedBy: 'Registrar Office'
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await ClassSchedule.deleteMany({});
    await Announcement.deleteMany({});
    await Instructor.deleteMany({});
    await Department.deleteMany({});

    // Seed departments
    console.log('🏫 Seeding departments...');
    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Seed instructors
    console.log('👨‍🏫 Seeding instructors...');
    const createdInstructors = await Instructor.insertMany(instructors);
    console.log(`✅ Created ${createdInstructors.length} instructors`);

    // Seed class schedules
    console.log('📅 Seeding class schedules...');
    const createdSchedules = await ClassSchedule.insertMany(classSchedules);
    console.log(`✅ Created ${createdSchedules.length} class schedules`);

    // Seed announcements
    console.log('📢 Seeding announcements...');
    const createdAnnouncements = await Announcement.insertMany(announcements);
    console.log(`✅ Created ${createdAnnouncements.length} announcements`);

    console.log('🎉 Database seeded successfully!');
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   Departments: ${createdDepartments.length}`);
    console.log(`   Instructors: ${createdInstructors.length}`);
    console.log(`   Class Schedules: ${createdSchedules.length}`);
    console.log(`   Announcements: ${createdAnnouncements.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
