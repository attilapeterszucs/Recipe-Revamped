import React, { useState } from 'react';
import { Plus, Target, Calendar, TrendingUp, TrendingDown, Activity, User, X, Edit3, Check } from 'lucide-react';
import type { HealthGoal, PersonalProfile } from '../types/userSettings';
import { createHealthGoal, HEALTH_GOAL_TEMPLATES } from '../types/userSettings';
import { updateUserSettings } from '../lib/userSettings';
import { useToast } from './ToastContainer';
import { logger } from '../lib/logger';
import { CustomDropdown } from './CustomDropdown';

interface HealthGoalsManagerProps {
  personalProfile: PersonalProfile;
  onUpdateProfile: (profile: PersonalProfile) => void;
  disabled?: boolean;
  preferredUnits?: 'metric' | 'imperial';
  userId: string;
}

export const HealthGoalsManager: React.FC<HealthGoalsManagerProps> = ({
  personalProfile,
  onUpdateProfile,
  disabled = false,
  preferredUnits = 'metric',
  userId
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<HealthGoal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Helper function to recursively remove undefined values from objects
  const cleanUndefinedValues = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(cleanUndefinedValues).filter(item => item !== undefined);
    }

    if (obj instanceof Date) {
      return obj;
    }

    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = cleanUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }

    return obj;
  };

  // Helper function to get appropriate unit based on goal type and user preferences
  const getDefaultUnit = (goalType: HealthGoal['type']): string | undefined => {
    if (goalType === 'weight_loss' || goalType === 'weight_gain' || goalType === 'muscle_gain') {
      return preferredUnits === 'metric' ? 'kg' : 'lbs';
    }
    return undefined;
  };
  const getInitialGoalState = (): Partial<HealthGoal> => ({
    type: 'weight_loss',
    title: '',
    description: '',
    priority: 'medium',
    isActive: true,
    unit: getDefaultUnit('weight_loss')
  });

  const [newGoal, setNewGoal] = useState<Partial<HealthGoal>>(getInitialGoalState());

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.description) return;

    const goal = createHealthGoal(
      newGoal.type!,
      newGoal.title,
      newGoal.description,
      {
        targetValue: newGoal.targetValue,
        currentValue: newGoal.currentValue,
        unit: newGoal.unit,
        targetDate: newGoal.targetDate,
        priority: newGoal.priority
      }
    );

    const updatedProfile = {
      ...personalProfile,
      healthGoals: [...personalProfile.healthGoals, goal],
      updatedAt: new Date()
    };

    try {
      // Clean undefined values before saving to Firestore
      const cleanedData = cleanUndefinedValues({ personalProfile: updatedProfile });
      // Save directly to Firestore
      await updateUserSettings(userId, cleanedData);
      // Update local state only after successful save
      onUpdateProfile(updatedProfile);
      setShowAddModal(false);
      setNewGoal(getInitialGoalState());
      // Show success notification
      showSuccess('Health Goal Added', `"${goal.title}" has been successfully added to your health goals.`, 'settings');
    } catch (error) {
      logger.error('Failed to save health goal:', { error });
      showError('Failed to Add Goal', 'Unable to save your health goal. Please try again.', 'settings');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<HealthGoal>) => {
    const updatedProfile = {
      ...personalProfile,
      healthGoals: personalProfile.healthGoals.map(goal =>
        goal.id === goalId
          ? { ...goal, ...updates, updatedAt: new Date() }
          : goal
      ),
      updatedAt: new Date()
    };

    try {
      // Clean undefined values before saving to Firestore
      const cleanedData = cleanUndefinedValues({ personalProfile: updatedProfile });
      // Save directly to Firestore
      await updateUserSettings(userId, cleanedData);
      // Update local state only after successful save
      onUpdateProfile(updatedProfile);
      setEditingGoal(null);
      // Show success notification
      const updatedGoal = updatedProfile.healthGoals.find(g => g.id === goalId);
      showSuccess('Health Goal Updated', `"${updatedGoal?.title || 'Goal'}" has been successfully updated.`, 'settings');
    } catch (error) {
      logger.error('Failed to update health goal:', { error });
      showError('Failed to Update Goal', 'Unable to update your health goal. Please try again.', 'settings');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const updatedProfile = {
      ...personalProfile,
      healthGoals: personalProfile.healthGoals.filter(goal => goal.id !== goalId),
      updatedAt: new Date()
    };

    try {
      // Get goal title before deletion for notification
      const goalToDelete = personalProfile.healthGoals.find(g => g.id === goalId);
      // Clean undefined values before saving to Firestore
      const cleanedData = cleanUndefinedValues({ personalProfile: updatedProfile });
      // Save directly to Firestore
      await updateUserSettings(userId, cleanedData);
      // Update local state only after successful save
      onUpdateProfile(updatedProfile);
      setDeletingGoalId(null);
      // Show success notification
      showSuccess('Health Goal Deleted', `"${goalToDelete?.title || 'Goal'}" has been successfully deleted.`, 'delete');
    } catch (error) {
      logger.error('Failed to delete health goal:', { error });
      showError('Failed to Delete Goal', 'Unable to delete your health goal. Please try again.', 'delete');
    }
  };

  const handleEditGoal = (goal: HealthGoal) => {
    setEditingGoal(goal);
  };

  const handleSaveEditGoal = async () => {
    if (!editingGoal || !editingGoal.title || !editingGoal.description) return;

    await handleUpdateGoal(editingGoal.id, {
      type: editingGoal.type,
      title: editingGoal.title,
      description: editingGoal.description,
      targetValue: editingGoal.targetValue,
      currentValue: editingGoal.currentValue,
      unit: editingGoal.unit,
      targetDate: editingGoal.targetDate,
      priority: editingGoal.priority
    });
  };

  const handleToggleGoal = async (goalId: string) => {
    const goal = personalProfile.healthGoals.find(g => g.id === goalId);
    if (goal) {
      const newStatus = !goal.isActive;
      const updatedProfile = {
        ...personalProfile,
        healthGoals: personalProfile.healthGoals.map(g =>
          g.id === goalId
            ? { ...g, isActive: newStatus, updatedAt: new Date() }
            : g
        ),
        updatedAt: new Date()
      };

      try {
        // Clean undefined values before saving to Firestore
        const cleanedData = cleanUndefinedValues({ personalProfile: updatedProfile });
        // Save directly to Firestore
        await updateUserSettings(userId, cleanedData);
        // Update local state only after successful save
        onUpdateProfile(updatedProfile);
        // Show appropriate success notification
        if (newStatus) {
          showSuccess('Goal Reactivated', `"${goal.title}" has been reactivated and is now active.`, 'settings');
        } else {
          showSuccess('Goal Completed', `"${goal.title}" has been marked as completed. Great job!`, 'settings');
        }
      } catch (error) {
        logger.error('Failed to toggle health goal:', { error });
        showError('Failed to Update Goal', 'Unable to update your health goal status. Please try again.', 'settings');
      }
    }
  };

  const getGoalIcon = (type: HealthGoal['type']) => {
    switch (type) {
      case 'weight_loss':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'weight_gain':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'muscle_gain':
        return <Activity className="w-5 h-5 text-blue-500" />;
      case 'performance':
        return <Target className="w-5 h-5 text-purple-500" />;
      case 'lifestyle':
        return <User className="w-5 h-5 text-orange-500" />;
      default:
        return <Target className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: HealthGoal['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeGoals = personalProfile.healthGoals.filter(goal => goal.isActive);
  const inactiveGoals = personalProfile.healthGoals.filter(goal => !goal.isActive);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border-2 border-green-100 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900">Health Goals</h3>
            <p className="text-sm text-gray-700 font-medium">
              Set and track your health and nutrition goals for personalized recipes
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-black text-gray-900">Active Goals</h4>
          {activeGoals.map((goal) => (
            <div key={goal.id} className="bg-gradient-to-br from-white to-green-50/20 border-2 border-green-100 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getGoalIcon(goal.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-gray-900">{goal.title}</h5>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 font-medium">{goal.description}</p>

                    {(goal.targetValue || goal.currentValue) && (
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        {goal.currentValue && (
                          <span className="text-gray-500">
                            Current: {goal.currentValue}{goal.unit}
                          </span>
                        )}
                        {goal.targetValue && (
                          <span className="text-gray-500">
                            Target: {goal.targetValue}{goal.unit}
                          </span>
                        )}
                        {goal.targetDate && !isNaN(new Date(goal.targetDate).getTime()) && (
                          <span className="text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditGoal(goal)}
                    disabled={disabled}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-all duration-200"
                    title="Edit goal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleGoal(goal.id)}
                    disabled={disabled}
                    className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-all duration-200"
                    title="Mark as completed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingGoalId(goal.id)}
                    disabled={disabled}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-all duration-200"
                    title="Delete goal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inactive Goals */}
      {inactiveGoals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-black text-gray-500">Completed Goals</h4>
          {inactiveGoals.map((goal) => (
            <div key={goal.id} className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl p-4 opacity-60 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getGoalIcon(goal.type)}
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-700">{goal.title}</h5>
                    <p className="text-sm text-gray-500 font-medium">{goal.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleGoal(goal.id)}
                    disabled={disabled}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-all duration-200"
                    title="Reactivate goal"
                  >
                    <Target className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingGoalId(goal.id)}
                    disabled={disabled}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-all duration-200"
                    title="Delete goal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {personalProfile.healthGoals.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Health Goals Set</h4>
          <p className="text-gray-600 mb-4">
            Add health goals to get personalized recipe recommendations that align with your objectives.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Your First Goal
          </button>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>

            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-white">Add Health Goal</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Goal Type
                  </label>
                  <CustomDropdown
                    value={newGoal.type || 'weight_loss'}
                    onChange={(value) => {
                      const goalType = value as HealthGoal['type'];
                      const template = HEALTH_GOAL_TEMPLATES[goalType];
                      setNewGoal({
                        ...newGoal,
                        type: goalType,
                        title: template?.title || '',
                        description: template?.description || '',
                        unit: getDefaultUnit(goalType)
                      });
                    }}
                    options={[
                      { value: 'weight_loss', label: 'Weight Loss', icon: '📉' },
                      { value: 'weight_gain', label: 'Weight Gain', icon: '📈' },
                      { value: 'muscle_gain', label: 'Muscle Building', icon: '💪' },
                      { value: 'performance', label: 'Athletic Performance', icon: '🏃' },
                      { value: 'lifestyle', label: 'Lifestyle Goal', icon: '🌟' },
                      { value: 'custom', label: 'Custom Goal', icon: '✏️' }
                    ]}
                    placeholder="Select goal type"
                    icon={<Target className="w-5 h-5 text-gray-400" />}
                    ariaLabel="Goal type selection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                    placeholder="e.g., Lose 5kg for summer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm resize-none"
                    placeholder="Describe your goal and motivation..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Current Value
                    </label>
                    <input
                      type="number"
                      value={newGoal.currentValue || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, currentValue: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Current"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={newGoal.targetValue || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Target"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Unit
                    </label>
                    <CustomDropdown
                      value={newGoal.unit || ''}
                      onChange={(value) => setNewGoal({ ...newGoal, unit: value })}
                      options={[
                        { value: '', label: 'Select unit', icon: '📏' },
                        { value: 'kg', label: 'Kilograms (kg)', icon: '⚖️' },
                        { value: 'lbs', label: 'Pounds (lbs)', icon: '📊' }
                      ]}
                      placeholder="Select unit"
                      ariaLabel="Unit selection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Priority
                    </label>
                    <CustomDropdown
                      value={newGoal.priority || 'medium'}
                      onChange={(value) => setNewGoal({ ...newGoal, priority: value as HealthGoal['priority'] })}
                      options={[
                        { value: 'low', label: 'Low', icon: '🟢' },
                        { value: 'medium', label: 'Medium', icon: '🟡' },
                        { value: 'high', label: 'High', icon: '🔴' }
                      ]}
                      placeholder="Select priority"
                      ariaLabel="Priority selection"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate ? new Date(newGoal.targetDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  />
                </div>
              </div>

            </div>

            {/* Footer with Action Buttons */}
            <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-green-50/30">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoal.title || !newGoal.description}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={() => setEditingGoal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>

            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                    <Edit3 className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-white">Edit Health Goal</h3>
                </div>
                <button
                  onClick={() => setEditingGoal(null)}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Goal Type
                  </label>
                  <CustomDropdown
                    value={editingGoal.type}
                    onChange={(value) => {
                      const goalType = value as HealthGoal['type'];
                      const template = HEALTH_GOAL_TEMPLATES[goalType];
                      setEditingGoal({
                        ...editingGoal,
                        type: goalType,
                        title: template?.title || editingGoal.title,
                        description: template?.description || editingGoal.description,
                        unit: getDefaultUnit(goalType) || editingGoal.unit
                      });
                    }}
                    options={[
                      { value: 'weight_loss', label: 'Weight Loss', icon: '📉' },
                      { value: 'weight_gain', label: 'Weight Gain', icon: '📈' },
                      { value: 'muscle_gain', label: 'Muscle Building', icon: '💪' },
                      { value: 'performance', label: 'Athletic Performance', icon: '🏃' },
                      { value: 'lifestyle', label: 'Lifestyle Goal', icon: '🌟' },
                      { value: 'custom', label: 'Custom Goal', icon: '✏️' }
                    ]}
                    placeholder="Select goal type"
                    icon={<Target className="w-5 h-5 text-gray-400" />}
                    ariaLabel="Goal type selection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={editingGoal.title}
                    onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                    placeholder="e.g., Lose 5kg for summer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingGoal.description}
                    onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm resize-none"
                    placeholder="Describe your goal and motivation..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Current Value
                    </label>
                    <input
                      type="number"
                      value={editingGoal.currentValue || ''}
                      onChange={(e) => setEditingGoal({ ...editingGoal, currentValue: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Current"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={editingGoal.targetValue || ''}
                      onChange={(e) => setEditingGoal({ ...editingGoal, targetValue: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                      placeholder="Target"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Unit
                    </label>
                    <CustomDropdown
                      value={editingGoal.unit || ''}
                      onChange={(value) => setEditingGoal({ ...editingGoal, unit: value })}
                      options={[
                        { value: '', label: 'Select unit', icon: '📏' },
                        { value: 'kg', label: 'Kilograms (kg)', icon: '⚖️' },
                        { value: 'lbs', label: 'Pounds (lbs)', icon: '📊' }
                      ]}
                      placeholder="Select unit"
                      ariaLabel="Unit selection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Priority
                    </label>
                    <CustomDropdown
                      value={editingGoal.priority}
                      onChange={(value) => setEditingGoal({ ...editingGoal, priority: value as HealthGoal['priority'] })}
                      options={[
                        { value: 'low', label: 'Low', icon: '🟢' },
                        { value: 'medium', label: 'Medium', icon: '🟡' },
                        { value: 'high', label: 'High', icon: '🔴' }
                      ]}
                      placeholder="Select priority"
                      ariaLabel="Priority selection"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingGoal.targetDate && !isNaN(new Date(editingGoal.targetDate).getTime()) ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 hover:border-green-300 shadow-sm"
                  />
                </div>
              </div>

            </div>

            {/* Footer with Action Buttons */}
            <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-green-50/30">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-bold shadow-sm hover:shadow-md hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditGoal}
                  disabled={!editingGoal.title || !editingGoal.description}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGoalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Health Goal</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this health goal? All progress and data associated with this goal will be permanently removed.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingGoalId(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteGoal(deletingGoalId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};