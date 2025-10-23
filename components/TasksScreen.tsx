import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface TasksScreenProps {
  tasks: Task[];
  onCreateTask: (text: string, dueDate: string, priority: 'High' | 'Medium' | 'Low') => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ tasks, onCreateTask, onToggleTask, onDeleteTask }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const handleCreateTask = () => {
    if (newTaskText.trim()) {
      onCreateTask(newTaskText.trim(), dueDate, priority);
      setNewTaskText('');
      setDueDate('');
      setPriority('Medium');
    }
  };

  const { pendingTasks, completedTasks } = useMemo(() => {
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };

    const sortedTasks = [...tasks].sort((a, b) => {
      // Completed tasks are sorted by timestamp (newest first)
      if (a.isCompleted && b.isCompleted) {
        return b.timestamp - a.timestamp;
      }
      // For pending tasks, sort by priority, then due date, then creation time
      const priorityA = priorityOrder[a.priority || 'Medium'];
      const priorityB = priorityOrder[b.priority || 'Medium'];
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.timestamp - b.timestamp;
    });

    return {
      pendingTasks: sortedTasks.filter(task => !task.isCompleted),
      completedTasks: sortedTasks.filter(task => task.isCompleted),
    };
  }, [tasks]);

  const PriorityBadge: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
    const styles = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[priority]}`}>
        {priority}
      </span>
    );
  };
  
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Add time to counteract timezone issues that might push date back a day
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
    <li className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={task.isCompleted}
          onChange={() => onToggleTask(task.id)}
          id={`task-${task.id}`}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
        />
        <div className="ml-3">
            <label
            htmlFor={`task-${task.id}`}
            className={`text-gray-800 cursor-pointer ${task.isCompleted ? 'line-through text-gray-500' : ''}`}
            >
            {task.text}
            </label>
            {!task.isCompleted && (
                 <div className="flex items-center space-x-2 mt-1 text-xs">
                    <PriorityBadge priority={task.priority} />
                    {task.dueDate && (
                        <span className="text-gray-500 font-medium">
                           Due {formatDueDate(task.dueDate)}
                        </span>
                    )}
                </div>
            )}
        </div>
      </div>
      <button
        onClick={() => onDeleteTask(task.id)}
        className="ml-4 p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        aria-label={`Delete task: ${task.text}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
        </svg>
      </button>
    </li>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
      
      {/* Add Task Input */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
        <textarea
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCreateTask())}
          placeholder="Add a new task..."
          className="w-full h-20 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                </select>
            </div>
            <button
                onClick={handleCreateTask}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition"
                disabled={!newTaskText.trim()}
            >
                Add Task
            </button>
        </div>
      </div>
      
      {/* Task Lists */}
      <div className="space-y-6">
        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">
            Pending ({pendingTasks.length})
          </h3>
          {pendingTasks.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {pendingTasks.map(task => <TaskItem key={task.id} task={task} />)}
            </ul>
          ) : (
            <p className="text-gray-500 p-4 text-center">No pending tasks. Great job!</p>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 p-4 border-b">
              Completed ({completedTasks.length})
            </h3>
            <ul className="divide-y divide-gray-200">
              {completedTasks.map(task => <TaskItem key={task.id} task={task} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksScreen;