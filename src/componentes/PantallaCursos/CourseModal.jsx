import React, { useState, useEffect } from 'react';

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
}) {
  const [form, setForm] = useState({
    titulo: '',
    instructor: '',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: '',
    categoria: '',
    descripcion: '',
    lista: '',
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (initialData.id) {
      setForm({
        titulo: initialData.titulo,
        instructor: initialData.instructor,
        fechaInicio: initialData.fechaInicio,
        fechaFin: initialData.fechaFin,
        ubicacion: initialData.ubicacion,
        categoria: initialData.categoria,
        descripcion: initialData.descripcion,
        lista: initialData.lista,
      });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const submit = e => {
    e.preventDefault();
    onSubmit(form, imageFile);
  };

  if (!isOpen) return null;
  return (
   <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-lg max-w-xl w-full p-6 space-y-4 overflow-y-auto max-h-full"
      >
        <h3 className="text-xl font-semibold">
          {initialData.id ? 'Editar Curso' : 'Nuevo Curso'}
        </h3>
        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['titulo','instructor','ubicacion','lista'].map(n => (
            <input
              key={n}
              name={n}
              value={form[n]}
              onChange={handleChange}
              placeholder={n.charAt(0).toUpperCase()+n.slice(1)}
              required={n==='titulo'||n==='instructor'}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          <input
            type="date"
            name="fechaInicio"
            value={form.fechaInicio}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="fechaFin"
            value={form.fechaFin}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Categoría</option>
            <option value="informatica">Informática</option>
            <option value="administracion">Administración</option>
            {/* …más… */}
          </select>
        </div>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows="3"
          placeholder="Descripción"
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files[0] || null)}
          className="w-full"
        />

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {initialData.id ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
