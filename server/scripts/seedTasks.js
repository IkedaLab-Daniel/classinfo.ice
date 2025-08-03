const Task = require('../models/Task');

const sampleTasks = [
  {
    title: "Complete React Assignment",
    description: "Build a responsive React application with routing and state management",
    type: "assignment",
    class: "Web Development",
    dueDate: new Date('2025-08-10'),
    status: "pending",
    priority: "high"
  },
  {
    title: "Database Design Project",
    description: "Design and implement a normalized database schema for the student management system",
    type: "project",
    class: "Database Systems",
    dueDate: new Date('2025-08-15'),
    status: "in-progress",
    priority: "urgent"
  },
  {
    title: "Chapter 5 Reading",
    description: "Read Chapter 5: Advanced JavaScript Concepts and complete the exercises",
    type: "reading",
    class: "Programming Fundamentals",
    dueDate: new Date('2025-08-05'),
    status: "completed",
    priority: "medium"
  },
  {
    title: "Midterm Exam",
    description: "Comprehensive exam covering topics 1-6",
    type: "exam",
    class: "Data Structures",
    dueDate: new Date('2025-08-12'),
    status: "pending",
    priority: "urgent"
  },
  {
    title: "UI/UX Presentation",
    description: "Present the mobile app design prototype to the class",
    type: "presentation",
    class: "Human-Computer Interaction",
    dueDate: new Date('2025-08-08'),
    status: "pending",
    priority: "high"
  },
  {
    title: "Algorithm Analysis Quiz",
    description: "Short quiz on Big O notation and time complexity",
    type: "quiz",
    class: "Algorithms",
    dueDate: new Date('2025-08-06'),
    status: "pending",
    priority: "medium"
  },
  {
    title: "Lab Exercise 3",
    description: "Implement sorting algorithms in Python",
    type: "lab",
    class: "Programming Fundamentals",
    dueDate: new Date('2025-08-04'),
    status: "overdue",
    priority: "high"
  },
  {
    title: "Research Paper Draft",
    description: "Submit first draft of research paper on machine learning applications",
    type: "assignment",
    class: "Artificial Intelligence",
    dueDate: new Date('2025-08-20'),
    status: "pending",
    priority: "medium"
  },
  {
    title: "CSS Homework",
    description: "Complete responsive design exercises using Flexbox and Grid",
    type: "homework",
    class: "Web Development",
    dueDate: new Date('2025-08-07'),
    status: "in-progress",
    priority: "low"
  },
  {
    title: "Group Project Planning",
    description: "Meet with team to plan the final project deliverables",
    type: "other",
    class: "Software Engineering",
    dueDate: new Date('2025-08-09'),
    status: "pending",
    priority: "medium"
  }
];

const seedTasks = async () => {
  try {
    console.log('🌱 Seeding tasks...');
    
    // Clear existing tasks
    await Task.deleteMany({});
    console.log('📝 Cleared existing tasks');
    
    // Insert sample tasks
    const tasks = await Task.insertMany(sampleTasks);
    console.log(`✅ Successfully seeded ${tasks.length} tasks`);
    
    // Display summary
    const statusCounts = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 Task Status Summary:');
    statusCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🎯 Sample tasks created successfully!');
    return tasks;
  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
    throw error;
  }
};

module.exports = { seedTasks, sampleTasks };
