// frontend/src/components/overview/networth/ManageTab.jsx
import React, { useState } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { AssetManager } from './AssetManager';
import { LiabilityManager } from './LiabilityManager';
import { EntryEditModal } from './EntryEditModal';
import { ConfirmationModal } from 'components/shared/FormComponents';

export const ManageTab = () => {
  const { isDarkMode } = useTheme();
  const [selectedType, setSelectedType] = useState('assets'); // 'assets' or 'liabilities'
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
  };

  const handleEditSuccess = () => {
    setEditingEntry(null);
    setRefreshKey(prev => prev + 1); // Trigger re-render
  };

  const handleDelete = (entry) => {
    setDeletingEntry(entry);
  };

  const handleDeleteConfirm = () => {
    if (deletingEntry) {
      dataManager.deleteNetWorthItem(deletingEntry.id);
      setDeletingEntry(null);
      setRefreshKey(prev => prev + 1); // Trigger re-render
    }
  };

  return (
    <div className="space-y-8">
      {/* Asset/Liability Sub-Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setSelectedType('assets')}
          className={`px-6 py-3 rounded-lg text-lg font-light transition-colors ${
            selectedType === 'assets'
              ? isDarkMode
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDarkMode
              ? 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              : 'bg-gray-100 text-gray-600 hover:text-black border border-gray-300'
          }`}
        >
          Assets
        </button>
        <button
          onClick={() => setSelectedType('liabilities')}
          className={`px-6 py-3 rounded-lg text-lg font-light transition-colors ${
            selectedType === 'liabilities'
              ? isDarkMode
                ? 'bg-white text-black'
                : 'bg-black text-white'
              : isDarkMode
              ? 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              : 'bg-gray-100 text-gray-600 hover:text-black border border-gray-300'
          }`}
        >
          Liabilities
        </button>
      </div>

      {/* Content */}
      {selectedType === 'assets' ? (
        <AssetManager
          key={`assets-${refreshKey}`}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <LiabilityManager
          key={`liabilities-${refreshKey}`}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Modal */}
      <EntryEditModal
        isOpen={editingEntry !== null}
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingEntry !== null}
        title="Delete Entry?"
        description={`Are you sure you want to delete "${deletingEntry?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEntry(null)}
        confirmDanger={true}
      />
    </div>
  );
};
