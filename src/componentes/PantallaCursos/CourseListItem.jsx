import React from 'react';

export default function CourseListItem({
  course,
  onView,
  onEdit,
  onDelete,
  canManage = true,     // ⬅️  por defecto true
}) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden relative">
      {/* Botón eliminar */}
      {canManage && (
        <button
          onClick={() => {
            if (
              window.confirm(
                `¿Estás seguro de que quieres eliminar el curso "${course.titulo}"? Esta acción no se puede deshacer.`
              )
            ) {
              onDelete(course);
            }
          }}
          className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded w-6 h-6 flex items-center justify-center text-sm transition-colors"
          title="Eliminar curso"
        >
          ×
        </button>
      )}

      {/* Imagen destacada */}
      <div className="h-32 bg-gray-100">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-1">
        <h3 className="text-lg font-semibold line-clamp-2">{course.titulo}</h3>
        <p className="text-sm text-gray-600">
          {course.fechaInicio} – {course.fechaFin || '…'}
        </p>
        <p className="text-sm">{course.instructor}</p>
        <p className="text-xs text-gray-500">
          {course.lista?.length || 0} participantes •{' '}
          {course.reportes?.length || 0} informes
        </p>
      </div>

      {/* Botones Acción */}
      <div className="flex border-t">
        <button
          onClick={onView}
          className="flex-1 px-4 py-2 hover:bg-gray-100 transition"
        >
          Ver
        </button>

        {canManage && (
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
