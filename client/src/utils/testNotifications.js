// Test notification utilities
export const createTestNotifications = (addNotification) => {
  // Sample notifications for testing
  const testNotifications = [
    {
      type: 'task-due',
      title: 'Assignment Due Soon',
      message: 'CS 101 Homework 3 is due in 2 hours',
      priority: 'high',
      data: { taskId: '1', subject: 'CS 101', dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000) }
    },
    {
      type: 'class-starting',
      title: 'Class Starting',
      message: 'Mathematics class starts in 15 minutes in Room 205',
      priority: 'medium',
      data: { classId: '2', subject: 'Mathematics', startTime: new Date(Date.now() + 15 * 60 * 1000), room: 'Room 205' }
    },
    {
      type: 'deadline',
      title: 'Project Deadline',
      message: 'Physics lab report is due tomorrow',
      priority: 'medium',
      data: { taskId: '3', subject: 'Physics', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    },
    {
      type: 'info',
      title: 'Schedule Updated',
      message: 'Your Wednesday schedule has been modified',
      priority: 'low',
      data: { day: 'Wednesday' }
    },
    {
      type: 'success',
      title: 'Task Completed',
      message: 'Great job! You completed all tasks for today',
      priority: 'low',
      data: { completedCount: 5 }
    }
  ];

  // Add notifications with small delays to simulate real-time
  testNotifications.forEach((notification, index) => {
    setTimeout(() => {
      addNotification(notification);
    }, index * 1000); // 1 second delay between each
  });
};

export const scheduleTestReminders = (scheduleNotification) => {
  // Schedule some future notifications for testing
  const now = new Date();
  
  // Schedule a class reminder for 5 minutes from now
  const classReminder = new Date(now.getTime() + 5 * 60 * 1000);
  scheduleNotification({
    type: 'class-starting',
    title: 'Class Reminder',
    message: 'Advanced Algorithms class starts in 10 minutes',
    priority: 'high',
    scheduledTime: classReminder,
    data: { classId: 'cs-advanced', subject: 'Advanced Algorithms', room: 'Lab 3' }
  });

  // Schedule a task due reminder for 3 minutes from now
  const taskReminder = new Date(now.getTime() + 3 * 60 * 1000);
  scheduleNotification({
    type: 'task-due',
    title: 'Task Due Soon',
    message: 'Database design assignment due in 30 minutes',
    priority: 'high',
    scheduledTime: taskReminder,
    data: { taskId: 'db-assignment', subject: 'Database Systems' }
  });
};
