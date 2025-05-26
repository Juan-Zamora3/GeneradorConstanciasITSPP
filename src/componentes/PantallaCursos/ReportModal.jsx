import React, { useState, useEffect } from 'react';

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  cursos = [],
  initialData = {},
}) {
  const [form, setForm] = useState({
    cursoId: '',
    tipo: '',
    titulo: '',
    fecha: '',
    descripcion: '',
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (initialData.id) {
      setForm({
        cursoId: initialData.cursoId,
        tipo: initialData.tipo,
        titulo: initialData.titulo,
        fecha: initialData.fecha,
        descripcion: initialData.descripcion,
      });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = e => {
    e.preventDefault();
    onSubmit(form, images);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg max-w-xl w-full p-6 space-y-4 overflow-y-auto max-h-full"
      >
        <h3 className="text-xl font-semibold">
          {initialData.id ? 'Editar Reporte' : 'Crear Nuevo Reporte'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select
            name="cursoId"
            value={form.cursoId}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          >
            <option value="">Seleccionar curso</option>
            {cursos.map(c => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          >
            <option value="">Tipo de reporte</option>
            <option value="asistencia">Asistencia</option>
            <option value="incidente">Incidente</option>
            <option value="evaluacion">Evaluación</option>
          </select>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Título"
            required
            className="border rounded px-3 py-2"
          />
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2"
          />
        </div>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows="3"
          placeholder="Descripción"
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e => setImages(Array.from(e.target.files))}
          className="w-full"
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Guardar reporte
          </button>
        </div>
      </form>
    </div>
  );
}
