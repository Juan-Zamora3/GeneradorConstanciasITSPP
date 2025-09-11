// src/componentes/PantallaCursos/CourseModal.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../servicios/firebaseConfig';

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
    tipoCurso: 'personal', // 'personal' o 'cursos'
    lista: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [personalList, setPersonalList] = useState([]);
  const [searchPersonal, setSearchPersonal] = useState('');
  const [filterArea, setFilterArea] = useState('');

  // Cargar datos iniciales si estamos editando
  useEffect(() => {
    if (initialData.id) {
      const existentes = Array.isArray(initialData.lista) ? initialData.lista : [];
      setForm({
        titulo: initialData.titulo || '',
        instructor: initialData.instructor || '',
        fechaInicio: initialData.fechaInicio || '',
        fechaFin: initialData.fechaFin || '',
        ubicacion: initialData.ubicacion || '',
        categoria: initialData.categoria || '',
        descripcion: initialData.descripcion || '',
        tipoCurso: initialData.tipoCurso || 'personal',
        lista: existentes,
      });
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    } else {
      // Reset para nuevo curso
      setForm({
        titulo: '',
        instructor: '',
        fechaInicio: '',
        fechaFin: '',
        ubicacion: '',
        categoria: '',
        descripcion: '',
        tipoCurso: 'personal',
        lista: [],
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [initialData]);

  // Traer lista de personal al abrir el modal
  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        const snap = await getDocs(collection(db, 'Personal'));
        setPersonalList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching personal:', err);
      }
    };
    if (isOpen) {
      fetchPersonal();
      setSearchPersonal('');
      setFilterArea('');
    }
  }, [isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handlePersonalToggle = id => {
    setForm(f => ({
      ...f,
      lista: f.lista.includes(id)
        ? f.lista.filter(x => x !== id)
        : [...f.lista, id]
    }));
  };

  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Filtrar personal por búsqueda y área
  const personalFiltrado = personalList.filter(a => {
    const nombre = `${a.Nombres} ${a.ApellidoP} ${a.ApellidoM}`.toLowerCase();
    const matchSearch = !searchPersonal || nombre.includes(searchPersonal.toLowerCase());
    const matchArea = !filterArea || a.Puesto.toLowerCase().includes(filterArea.toLowerCase());
    return matchSearch && matchArea;
  });

  const submit = e => {
    e.preventDefault();
    onSubmit(form, imageFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-6 overflow-y-auto max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            {initialData.id ? 'Editar Curso' : 'Nuevo Curso'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Formulario */}
        <form onSubmit={submit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Título del Curso *', name: 'titulo', type: 'text' },
                { label: 'Instructor *', name: 'instructor', type: 'text' },
                { label: 'Ubicación', name: 'ubicacion', type: 'text' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    type={f.type}
                    value={form[f.name]}
                    onChange={handleChange}
                    required={f.name !== 'ubicacion'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="informatica">Informática</option>
                  <option value="administracion">Administración</option>
                  <option value="ventas">Ventas</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {['fechaInicio', 'fechaFin'].map(name => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {name === 'fechaInicio' ? 'Fecha de Inicio *' : 'Fecha de Fin *'}
                  </label>
                  <input
                    type="date"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Descripción */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Descripción del curso..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Imagen */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Imagen del Curso</h4>
            <div className="flex items-center space-x-4">
              <label htmlFor="image-upload" className="text-blue-600 hover:text-blue-800 underline cursor-pointer">
                Seleccionar imagen
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Curso */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Tipo de Curso</h4>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona cómo se administrará este curso:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input
                    type="radio"
                    name="tipoCurso"
                    value="personal"
                    checked={form.tipoCurso === 'personal'}
                    onChange={handleChange}
                    className="mr-3 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Por Personal</div>
                    <div className="text-sm text-gray-600">
                      Gestión individual de participantes del personal existente
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-green-50 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="tipoCurso"
                    value="cursos"
                    checked={form.tipoCurso === 'cursos'}
                    onChange={handleChange}
                    className="mr-3 text-green-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Por Cursos</div>
                    <div className="text-sm text-gray-600">
                      Gestión por lotes o grupos de cursos relacionados
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Gestión de Personal */}
          {form.tipoCurso === 'personal' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Gestión de Personal</h4>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar personal..."
                value={searchPersonal}
                onChange={e => setSearchPersonal(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                className="w-full sm:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las áreas</option>
                {[...new Set(personalList.map(a => a.Puesto).filter(Boolean))].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista disponible */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Selección</span>
                  <span className="text-xs text-gray-500">{personalFiltrado.length} disponibles</span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white">
                  {personalFiltrado.length > 0 ? personalFiltrado.map(a => (
                    <label
                      key={a.id}
                      className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={form.lista.includes(a.id)}
                        onChange={() => handlePersonalToggle(a.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{a.Nombres} {a.ApellidoP}</div>
                        <div className="text-gray-500 text-xs">{a.Puesto}</div>
                      </div>
                    </label>
                  )) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {personalList.length === 0 ? 'No hay personal' : 'No encontrados'}
                    </div>
                  )}
                </div>
              </div>

              {/* Previsualización */}
              <div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">En el Curso</span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-blue-50">
                  {form.lista.length > 0 ? form.lista.map(id => {
                    const a = personalList.find(x => x.id === id);
                    return a ? (
                      <div key={id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div>
                          <div className="font-medium text-gray-900">{a.Nombres} {a.ApellidoP}</div>
                          <div className="text-blue-600 text-xs">{a.Puesto}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePersonalToggle(id)}
                          className="text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ) : null;
                  }) : (
                    <div className="p-4 text-center text-gray-500 text-sm">Ningún personal seleccionado</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Gestión por Cursos */}
          {form.tipoCurso === 'cursos' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Gestión por Cursos</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <i className="ri-information-line text-yellow-600 mr-2"></i>
                <span className="font-medium text-yellow-800">Funcionalidad en Desarrollo</span>
              </div>
              <p className="text-sm text-yellow-700">
                La gestión por cursos estará disponible próximamente. Esta opción permitirá administrar grupos de cursos relacionados de manera más eficiente.
              </p>
            </div>
          </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData.id ? 'Actualizar Curso' : 'Crear Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
