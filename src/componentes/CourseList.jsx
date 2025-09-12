import React, { useMemo, useState } from 'react';
import CourseListItem from './PantallaCursos/CourseListItem';
import { deleteCourseAndSurveys } from '@/servicios/cursos';

export default function CourseList({ courses, onView, onEdit, onDelete }) {
  // ids que se están eliminando para deshabilitar botón
  const [deletingIds, setDeletingIds] = useState(() => new Set());

  const isDeleting = (id) => deletingIds.has(id);

  const askAndDelete = async (c) => {
    if (!c?.id) return;
    if (!confirm(`¿Eliminar el curso "${c.titulo || c.nombre || c.id}" y sus encuestas asociadas?`)) return;

    setDeletingIds(s => new Set(s).add(c.id));
    try {
      await deleteCourseAndSurveys(c.id);
      // notifica al padre para refrescar (si el padre usa onSnapshot quizá no haga falta)
      onDelete?.(c);
    } catch (err) {
      console.error('Error al eliminar curso y encuestas:', err);
      alert('No se pudo eliminar. Revisa la consola para más detalles.');
    } finally {
      setDeletingIds(s => {
        const next = new Set(s);
        next.delete(c.id);
        return next;
      });
    }
  };

  const content = useMemo(() => {
    if (!courses?.length) {
      return (
        <div className="col-span-full text-center text-gray-500 border rounded p-10">
          Aún no hay cursos.
        </div>
      );
    }
    return courses.map(c => (
      <CourseListItem
        key={c.id}
        course={c}
        deleting={isDeleting(c.id)}
        onView={() => onView?.(c)}
        onEdit={() => onEdit?.(c)}
        onDelete={() => askAndDelete(c)}
      />
    ));
  }, [courses, deletingIds]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {content}
    </div>
  );
}
