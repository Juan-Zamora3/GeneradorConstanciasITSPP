import React from 'react';
import CourseListItem from './PantallaCursos/CourseListItem';

export default function CourseList({ courses, onView, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {courses.map(c => (
        <CourseListItem
          key={c.id}
          course={c}
          onView={() => onView(c)}
          onEdit={() => onEdit(c)}
          onDelete={() => onDelete(c)}
        />
      ))}
    </div>
  );
}
