import type { SchedulerTask } from "@/lib/types/task";
import type { TaskFormData } from "@/lib/types/taskForm";
import {
  AlertCircle,
  Bot,
  MapPin,
  Users,
  Tag,
  Trash2,
  Save,
  X,
} from "lucide-react";

interface TaskFormDialogProps {
  open: boolean;
  loading: boolean;
  error?: string | null;
  isCreateMode: boolean;
  editingTask: SchedulerTask | null;
  formData: TaskFormData;
  setFormData: React.Dispatch<
    React.SetStateAction<TaskFormData>
  >;
  onSubmit: () => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}

export default function  TaskFormDialog({
  open,
  loading,
  error,
  isCreateMode,
  editingTask,
  formData,
  setFormData,
  onSubmit,
  onClose,
  onDelete,
}: TaskFormDialogProps) {
    if (!open) return null;
    return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                <h2 className="text-2xl font-bold text-white">
                    {isCreateMode ? 'Create New Task' : 'Edit Task'}
                </h2>
                <p className="text-gray-400 mt-1">
                    {isCreateMode ? 'Add a new task to your schedule' : 'Update task details'}
                </p>
                </div>
                <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-all"
                >
                <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Task Title *
                    </label>
                    <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    placeholder="Enter task title..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                    </label>
                    <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all resize-none"
                    rows={3}
                    placeholder="Add task description..."
                    />
                </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                    </label>
                    <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                    </label>
                    <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time *
                    </label>
                    <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white transition-all"
                    />
                </div>
                </div>

                {/* Priority & Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                    </label>
                    <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskFormData["priority"] }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white transition-all"
                    >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reminder (minutes before)
                    </label>
                    <select
                    value={formData.reminderMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white transition-all"
                    >
                    <option value={0}>No reminder</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                    <option value={1440}>1 day</option>
                    </select>
                </div>
                </div>

                {/* Location & Attendees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                    </label>
                    <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    placeholder="Meeting room, address, or 'Virtual'"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Attendees
                    </label>
                    <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    placeholder="email1@example.com, email2@example.com"
                    />
                </div>
                </div>

                {/* Tags */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                </label>
                <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400 transition-all"
                    placeholder="meeting, urgent, project-alpha..."
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>

                {/* Advanced Options */}
                <div className="border-t border-gray-700/50 pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Advanced Options</h3>
                
                <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isAgenticTask}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAgenticTask: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-2 transition-all"
                    />
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span className="font-medium text-white">Agentic Task</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                        Allow AI agent to automatically handle this task when possible
                        </p>
                    </div>
                    </label>
                </div>
                </div>

                {/* Error Display */}
                {error && (
                <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Error</span>
                    </div>
                    <p className="text-red-300 mt-1">{error}</p>
                </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between space-x-4 mt-8 pt-6 border-t border-gray-700/50">
                <div>
                {!isCreateMode && editingTask && (
                    <button
                    onClick={async() => {
                        await onDelete?.()
                        onClose();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all border border-red-600/30"
                    >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Task</span>
                    </button>
                )}
                </div>

                <div className="flex items-center space-x-3">
                <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all border border-gray-600/50"
                >
                    Cancel
                </button>
                
                <button
                    onClick={onSubmit}
                    disabled={!formData.title.trim() || loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : isCreateMode ? 'Create Task' : 'Save Changes'}</span>
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    )
}