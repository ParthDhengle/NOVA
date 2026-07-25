import React from "react";
import {
  Calendar,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

interface SchedulerHeaderProps {
  loading: boolean;

  autoRefresh: boolean;
  setAutoRefresh: React.Dispatch<React.SetStateAction<boolean>>;

  lastRefresh: Date;

  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  filterStatus: "all" | "pending" | "completed";
  setFilterStatus: React.Dispatch<
    React.SetStateAction<"all" | "pending" | "completed">
  >;

  filterPriority: "all" | "High" | "Medium" | "Low";
  setFilterPriority: React.Dispatch<
    React.SetStateAction<"all" | "High" | "Medium" | "Low">
  >;

  showCompleted: boolean;
  setShowCompleted: React.Dispatch<React.SetStateAction<boolean>>;

  filteredCount: number;
  totalCount: number;

  onRefresh: () => void;
  onCreateTask: () => void;

  isAuthenticated: boolean;
}

export default function SchedulerHeader({
  loading,
  autoRefresh,
  setAutoRefresh,
  lastRefresh,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  showCompleted,
  setShowCompleted,
  filteredCount,
  totalCount,
  onRefresh,
  onCreateTask,
  isAuthenticated,
}: SchedulerHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-blue-400" />

              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Scheduler
              </h1>

              <div className="flex items-center space-x-2 text-xs">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAuthenticated
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />

                <span className="text-gray-400">
                  {isAuthenticated ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Auto Refresh */}

            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) =>
                    setAutoRefresh(e.target.checked)
                  }
                  className="rounded border-gray-600 bg-gray-800"
                />

                <span>Auto-sync</span>
              </label>

              <div className="text-xs text-gray-500">
                Last: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>

            {/* Search */}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search tasks..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white"
              />
            </div>

            {/* Refresh */}

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-gray-800/50 rounded-lg border border-gray-600/50"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>

            {/* Create */}

            <button
              onClick={onCreateTask}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Filters */}

        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">
              Filters:
            </span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as
                  | "all"
                  | "pending"
                  | "completed"
              )
            }
            className="px-3 py-1 bg-gray-800 rounded"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(
                e.target.value as
                  | "all"
                  | "High"
                  | "Medium"
                  | "Low"
              )
            }
            className="px-3 py-1 bg-gray-800 rounded"
          >
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) =>
                setShowCompleted(e.target.checked)
              }
            />
            Show completed
          </label>

          {(searchQuery ||
            filterStatus !== "all" ||
            filterPriority !== "all") && (
            <div className="text-sm text-gray-400">
              {filteredCount} of {totalCount} tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}