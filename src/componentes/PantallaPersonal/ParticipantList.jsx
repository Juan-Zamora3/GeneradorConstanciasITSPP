import React from 'react';
import PropTypes from 'prop-types';
import ParticipantCard from './ParticipantCard';

export default function ParticipantList({ participants, onView, onEdit, onDelete }) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
          <i className="ri-user-search-line text-4xl text-gray-400"></i>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No hay participantes</h3>
        <p className="mt-2 text-sm text-gray-500">Agrega tu primer participante.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {participants.map(p => (
        <ParticipantCard
          key={p.id}
          participant={p}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

ParticipantList.propTypes = {
  participants: PropTypes.array.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
