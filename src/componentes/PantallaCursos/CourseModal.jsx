
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
    lista: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [searchAlumnos, setSearchAlumnos] = useState('');
  const [filterArea, setFilterArea] = useState('');

  useEffect(() => {
    if (initialData.id) {
      // Para editar, obtener participantes desde initialData.lista
      const participantesExistentes = Array.isArray(initialData.lista) 
        ? initialData.lista 
        : [];
      
      setForm({
        titulo: initialData.titulo || '',
        instructor: initialData.instructor || '',
        fechaInicio: initialData.fechaInicio || '',
        fechaFin: initialData.fechaFin || '',
        ubicacion: initialData.ubicacion || '',
        categoria: initialData.categoria || '',
        descripcion: initialData.descripcion || '',
        lista: participantesExistentes,
      });
      if (initialData.imageUrl) {
        setImagePreview(initialData.imageUrl);
      }
    } else {
      // Resetear formulario para nuevo curso
      setForm({
        titulo: '',
        instructor: '',
        fechaInicio: '',
        fechaFin: '',
        ubicacion: '',
        categoria: '',
        descripcion: '',
        lista: [],
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [initialData]);

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const alumnosSnapshot = await getDocs(collection(db, 'Alumnos'));
        const alumnosList = alumnosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlumnos(alumnosList);
      } catch (error) {
        console.error('Error fetching alumnos:', error);
      }
    };

    if (isOpen) {
      fetchAlumnos();
      setSearchAlumnos('');
      setFilterArea('');
    }
  }, [isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAlumnoToggle = (alumnoId) => {
    setForm(f => ({
      ...f,
      lista: f.lista.includes(alumnoId)
        ? f.lista.filter(id => id !== alumnoId)
        : [...f.lista, alumnoId]
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const alumnosFiltrados = alumnos.filter(alumno => {
    const nombreCompleto = `${alumno.Nombres} ${alumno.ApellidoP} ${alumno.ApellidoM}`.toLowerCase();
    const coincideBusqueda = searchAlumnos === '' || nombreCompleto.includes(searchAlumnos.toLowerCase());
    const coincideArea = filterArea === '' || alumno.Puesto.toLowerCase().includes(filterArea.toLowerCase());
    return coincideBusqueda && coincideArea;
  });

  const submit = e => {
    e.preventDefault();
    onSubmit(form, imageFile);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-6 overflow-y-auto max-h-[90vh] shadow-2xl">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            {initialData.id ? 'Editar Curso' : 'Nuevo Curso'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Información Básica</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Título del Curso *</label>
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ingrese el título del curso"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Instructor *</label>
                <input
                  name="instructor"
                  value={form.instructor}
                  onChange={handleChange}
                  placeholder="Nombre del instructor"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ubicación</label>
                <input
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  placeholder="Ubicación del curso"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Categoría *</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="informatica">Informática</option>
                  <option value="administracion">Administración</option>
                  <option value="ventas">Ventas</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>

            {/* Fechas en la misma línea */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Inicio *</label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={form.fechaInicio}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Fin *</label>
                <input
                  type="date"
                  name="fechaFin"
                  value={form.fechaFin}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows="3"
                placeholder="Descripción del curso..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Imagen del Curso */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Imagen del Curso</h4>
            <div className="flex flex-col space-y-4">
              <div>
                <label htmlFor="image-upload" className="inline-block text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium">
                  Seleccionar imagen
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* Previsualizador de imagen */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Alumnos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Gestión de Alumnos
            </h4>
            
            {/* Controles de búsqueda y filtro */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar alumnos..."
                value={searchAlumnos}
                onChange={(e) => setSearchAlumnos(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full sm:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las áreas</option>
                {[...new Set(alumnos.map(a => a.Puesto).filter(puesto => puesto))].map(puesto => (
                  <option key={puesto} value={puesto}>{puesto}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Selección de Alumnos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Seleccionar Alumnos
                  </label>
                  <span className="text-xs text-gray-500">
                    {alumnosFiltrados.length} disponibles
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-white">
                  {alumnosFiltrados.length > 0 ? (
                    alumnosFiltrados.map(alumno => (
                      <div key={alumno.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors">
                        <input
                          type="checkbox"
                          id={`alumno-${alumno.id}`}
                          checked={form.lista.includes(alumno.id)}
                          onChange={() => handleAlumnoToggle(alumno.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`alumno-${alumno.id}`} className="flex-1 text-sm cursor-pointer">
                          <div className="font-medium text-gray-900">{alumno.Nombres} {alumno.ApellidoP} {alumno.ApellidoM}</div>
                          <div className="text-gray-500 text-xs">{alumno.Puesto}</div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {alumnos.length === 0 ? 'No hay alumnos disponibles' : 'No se encontraron alumnos con los filtros aplicados'}
                    </div>
                  )}
                </div>
              </div>

              {/* Previsualización de Alumnos Seleccionados */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Alumnos en el Curso
                  </label>
                </div>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto bg-blue-50">
                  {form.lista.length > 0 ? (
                    form.lista.map(alumnoId => {
                      const alumno = alumnos.find(a => a.id === alumnoId);
                      return alumno ? (
                        <div key={alumno.id} className="flex items-center justify-between p-3 border-b border-blue-200 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{alumno.Nombres} {alumno.ApellidoP}</div>
                            <div className="text-blue-600 text-xs">{alumno.Puesto}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAlumnoToggle(alumno.id)}
                            className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : null;
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Ningún alumno seleccionado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              {initialData.id ? 'Actualizar Curso' : 'Crear Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
