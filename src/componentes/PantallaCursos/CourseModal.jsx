import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, query, where, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../servicios/firebaseConfig';

const toSurveyQuestions = (lista = []) => {
  const tipoMap = { abierta: 'text', combobox: 'select', multiple: 'radio', checklist: 'checkbox' };
  return lista.map((p, i) => ({
    id: `p${i + 1}`,
    etiqueta: p.titulo?.trim() || `Pregunta ${i + 1}`,
    tipo: tipoMap[p.tipo] || 'text',
    opciones: Array.isArray(p.opciones) ? p.opciones.filter(Boolean) : [],
    requerida: !!p.requerida,
  }));
};
const defaultTheme = {
  backgroundColor: '#f5f7fb',
  backgroundImage: '',   // DataURL base64
  titleColor: '#111827',
  textColor: '#374151',
  overlayOpacity: 0.35,
};

const emptyQuestion = {
  titulo: '',
  tipo: 'abierta',
  requerida: false,
  opciones: [],
};

export default function CourseModal({
  isOpen,
  onClose,
  onSubmit,          // se sigue llamando si tu padre lo usa
  initialData = {},
}) {
  const createInitialForm = useCallback(() => ({
    titulo: '',
    instructor: '',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: '',
    categoria: '',
    descripcion: '',
    tipoCurso: 'personal',     // 'personal' | 'grupos'
    lista: [],
    theme: defaultTheme,       // apariencia SOLO aplica a “grupos”
    formularioGrupos: {
      camposPreestablecidos: {
        nombreEquipo: true,
        nombreLider: true,
        contactoEquipo: true,
        categoria: true,
        cantidadParticipantes: true,
      },
      cantidadParticipantes: 1,
      preguntasPersonalizadas: [],
      categorias: [],
    },
  }), []);

  const [form, setForm] = useState(createInitialForm());

  // imagen de portada del curso (no es la de la pantalla del formulario)
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const imageInputRef = useRef(null);
  const themeFileRef = useRef(null);

  const [personalList, setPersonalList] = useState([]);
  const [editandoPregunta, setEditandoPregunta] = useState(null);
  const [nuevaPregunta, setNuevaPregunta] = useState(emptyQuestion);
  const [searchPersonal, setSearchPersonal] = useState('');
  const [filterArea, setFilterArea] = useState('');

  const isEdit = Boolean(initialData.id);

  const resetState = useCallback(() => {
    setForm(createInitialForm());
    setImageFile(null);
    setImagePreview(null);
    setEditandoPregunta(null);
    setNuevaPregunta(emptyQuestion);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (themeFileRef.current) themeFileRef.current.value = '';
  }, [createInitialForm]);

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  // Cargar datos iniciales al abrir/editar
  useEffect(() => {
    if (!isOpen) return;
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
        theme: { ...defaultTheme, ...(initialData.theme || {}) },
        formularioGrupos: {
          camposPreestablecidos: {
            nombreEquipo: true,
            nombreLider: true,
            contactoEquipo: true,
            categoria: true,
            cantidadParticipantes: true, // ⬅️ nuevo campo
            ...(initialData.formularioGrupos?.camposPreestablecidos || {}),
          },
          cantidadParticipantes: initialData.formularioGrupos?.cantidadParticipantes ?? 1,
          preguntasPersonalizadas: initialData.formularioGrupos?.preguntasPersonalizadas || [],
          categorias: initialData.formularioGrupos?.categorias || [],
        },
      });
      if (initialData.imageUrl) setImagePreview(initialData.imageUrl);
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (themeFileRef.current) themeFileRef.current.value = '';
    } else {
      resetState();
    }
  }, [initialData, isOpen, resetState]);

  // Personal
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
      lista: f.lista.includes(id) ? f.lista.filter(x => x !== id) : [...f.lista, id],
    }));
  };

  // Imagen de portada (base64)
  const handleImageUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Apariencia: imagen de fondo base64
  const handleThemeFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, theme: { ...f.theme, backgroundImage: ev.target.result } }));
    };
    reader.readAsDataURL(file);
  };

  const removeThemeImage = () => {
    setForm(f => ({ ...f, theme: { ...f.theme, backgroundImage: '' } }));
    if (themeFileRef.current) themeFileRef.current.value = '';
  };

  // Filtros de personal
  const personalFiltrado = personalList.filter(a => {
    const nombre = `${a.Nombres} ${a.ApellidoP} ${a.ApellidoM}`.toLowerCase();
    const matchSearch = !searchPersonal || nombre.includes(searchPersonal.toLowerCase());
    const matchArea = !filterArea || (a.Puesto || '').toLowerCase().includes(filterArea.toLowerCase());
    return matchSearch && matchArea;
  });

  // Guardar (llama al padre y asegura persistencia en edición)
const submit = async (e) => {
  e.preventDefault();

  onSubmit?.({ ...form, imageUrl: imagePreview }, imageFile);

  const cats = Array.from(new Set(form.formularioGrupos?.categorias || []));

  // Guarda el curso (cuando editas)
  if (isEdit) {
    await updateDoc(doc(db, 'Cursos', initialData.id), {
      ...form,
      formularioGrupos: { ...form.formularioGrupos, categorias: cats },
      imageUrl: imagePreview || initialData.imageUrl || '',
      updatedAt: new Date(),
    });
  }

  // ---------- Encuesta (lo que lee el formulario público) ----------
  // 1) Resuelve el id de encuesta
  let encuestaId = initialData.encuestaId;
  if (!encuestaId && initialData.id) {
    const q = query(
      collection(db, 'encuestas'),
      where('cursoId', '==', initialData.id),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) encuestaId = snap.docs[0].id;
  }
  if (!encuestaId) return; // no hay encuesta que actualizar

  // 2) Calcula payload
  const cantidad = Math.max(1, Number(form.formularioGrupos?.cantidadParticipantes ?? 1) || 1);
  const campos = {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
    categoria: true,
    cantidadParticipantes: true,
    ...(form.formularioGrupos?.camposPreestablecidos || {}),
  };

  // 👇 Usa la función ya definida arriba
  const preguntas = toSurveyQuestions(form.formularioGrupos?.preguntasPersonalizadas || []);

  // 3) Un SOLO update al doc correcto
  await updateDoc(doc(db, 'encuestas', encuestaId), {
    titulo: `Registro de Grupos – ${form.titulo || ''}`,
    descripcion: form.descripcion || '',
    theme: form.theme,

    cantidadParticipantes: cantidad,
    camposPreestablecidos: campos,
    formularioGrupos: {
      ...(initialData.formularioGrupos || {}),
      cantidadParticipantes: cantidad,
      categorias: cats,
    },

    // claves que lee RegistroGrupo
    preguntas,
    form: { preguntas },            // compat opcional
    questions: preguntas,           // compat opcional
    questionsVersion: Date.now(),   // fuerza refresh

    updatedAt: new Date(),
  });
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/30 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-6 overflow-y-auto max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Curso' : 'Nuevo Curso'}
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">{f.label}</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Categoría *</label>
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
              <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
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

          {/* Imagen del curso */}
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
                ref={imageInputRef}
                className="hidden"
              />
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Vista previa" className="w-24 h-24 object-cover rounded-lg border" />
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
              <p className="text-sm text-gray-600 mb-4">Selecciona cómo se administrará este curso:</p>
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
                    <div className="text-sm text-gray-600">Gestión individual de participantes del personal existente</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-green-50 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                  <input 
                    type="radio"
                    name="tipoCurso"
                    value="grupos"
                    checked={form.tipoCurso === 'grupos'}
                    onChange={handleChange}
                    className="mr-3 text-green-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Por Grupos</div>
                    <div className="text-sm text-gray-600">Gestión por grupos o lotes de participantes</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Apariencia + Configuración DEL FORMULARIO (solo si es Por Grupos) */}
          {form.tipoCurso === 'grupos' && (
            <>
              {/* Apariencia de la pantalla del formulario */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-700 mb-4">Apariencia de la pantalla del formulario</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Color de fondo</span>
                    <input
                      type="color"
                      value={form.theme.backgroundColor}
                      onChange={(e) => setForm(f => ({ ...f, theme: { ...f.theme, backgroundColor: e.target.value } }))}
                      className="w-full h-10 rounded border"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Imagen de fondo (desde tu equipo)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThemeFile}
                      ref={themeFileRef}
                      className="w-full rounded border px-2 py-2"
                    />
                    {form.theme.backgroundImage && (
                      <div className="relative mt-2">
                        <img
                          src={form.theme.backgroundImage}
                          alt="Vista previa de fondo"
                          className="w-24 h-24 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={removeThemeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </label>

                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Color del título</span>
                    <input
                      type="color"
                      value={form.theme.titleColor}
                      onChange={(e) => setForm(f => ({ ...f, theme: { ...f.theme, titleColor: e.target.value } }))}
                      className="w-full h-10 rounded border"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Color del texto</span>
                    <input
                      type="color"
                      value={form.theme.textColor}
                      onChange={(e) => setForm(f => ({ ...f, theme: { ...f.theme, textColor: e.target.value } }))}
                      className="w-full h-10 rounded border"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-gray-600 mb-1">Opacidad del overlay (0–1)</span>
                    <input
                      type="number" min="0" max="1" step="0.05"
                      value={form.theme.overlayOpacity}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(1, Number(e.target.value)));
                        setForm(f => ({ ...f, theme: { ...f.theme, overlayOpacity: v } }));
                      }}
                      className="w-full rounded border px-2 py-2"
                    />
                  </label>
                </div>

                {/* Previsualización rápida */}
                <div className="mt-3">
                  <div className="rounded-lg border bg-white p-3 text-xs text-gray-600">
                    <div className="mb-2 font-medium">Previsualización</div>
                    <div
                      className="h-36 rounded relative flex items-center justify-center"
                      style={{
                        backgroundColor: form.theme.backgroundColor,
                        backgroundImage: form.theme.backgroundImage ? `url(${form.theme.backgroundImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {form.theme.backgroundImage && (
                        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${form.theme.overlayOpacity || 0})` }} />
                      )}
                      <div className="relative text-center">
                        <div className="text-lg font-semibold" style={{ color: form.theme.titleColor }}>Título de ejemplo</div>
                        <div className="text-xs mt-1" style={{ color: form.theme.textColor }}>Texto de ejemplo del formulario</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuración del formulario por grupos */}
              <GruposSection
                form={form}
                setForm={setForm}
                editandoPregunta={editandoPregunta}
                setEditandoPregunta={setEditandoPregunta}
                nuevaPregunta={nuevaPregunta}
                setNuevaPregunta={setNuevaPregunta}
              />
            </>
          )}

          {/* Gestión de Personal */}
          {form.tipoCurso === 'personal' && (
            <PersonalSection
              personalList={personalList}
              personalFiltrado={personalFiltrado}
              form={form}
              searchPersonal={searchPersonal}
              setSearchPersonal={setSearchPersonal}
              filterArea={filterArea}
              setFilterArea={setFilterArea}
              handlePersonalToggle={handlePersonalToggle}
            />
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {isEdit ? 'Actualizar Curso' : 'Crear Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== Sub-secciones ===================== */

function PersonalSection({
  personalList, personalFiltrado, form,
  searchPersonal, setSearchPersonal, filterArea, setFilterArea, handlePersonalToggle
}) {
  return (
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
              <label key={a.id} className="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0">
                <input type="checkbox" checked={form.lista.includes(a.id)} onChange={() => handlePersonalToggle(a.id)} className="mr-3" />
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
                  <button type="button" onClick={() => handlePersonalToggle(id)} className="text-red-500">×</button>
                </div>
              ) : null;
            }) : (
              <div className="p-4 text-center text-gray-500 text-sm">Ningún personal seleccionado</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GruposSection({
  form, setForm, editandoPregunta, setEditandoPregunta, nuevaPregunta, setNuevaPregunta
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-lg font-semibold text-gray-700 mb-4">Configuración del Formulario de Grupos</h4>

      {/* Campos Preestablecidos */}
      <div className="mb-6">
        <h5 className="text-md font-medium text-gray-700 mb-3">Campos Preestablecidos</h5>
        <div className="space-y-2">
          {[
            { key: 'nombreEquipo', label: 'Nombre del Equipo' },
            { key: 'nombreLider', label: 'Nombre del Líder del Equipo' },
            { key: 'contactoEquipo', label: 'Contacto del Equipo' },
            { key: 'categoria', label: 'Categoría' },
            { key: 'cantidadParticipantes', label: 'Cantidad de Participantes' },
          ].map(c => (
            <label key={c.key} className="flex items-center">
              <input
                type="checkbox"
                checked={form.formularioGrupos.camposPreestablecidos[c.key]}
                onChange={(e) => setForm(prev => ({
                  ...prev,
                  formularioGrupos: {
                    ...prev.formularioGrupos,
                    camposPreestablecidos: {
                      ...prev.formularioGrupos.camposPreestablecidos,
                      [c.key]: e.target.checked,
                    },
                  },
                }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{c.label}</span>
            </label>
          ))}
        </div>
      </div>
      {form.formularioGrupos.camposPreestablecidos.categoria && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opciones de Categoría (una por línea)
          </label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={3}
            value={(form.formularioGrupos.categorias || []).join('\n')}
            onChange={(e) => {
              const cats = Array.from(
                new Set(
                  e.target.value
                    .split('\n')
                    .map((c) => c.trim())
                    .filter(Boolean)
                )
              );
              setForm((prev) => ({
                ...prev,
                formularioGrupos: {
                  ...prev.formularioGrupos,
                  categorias: cats,
                },
              }));
            }}
          />
        </div>
      )}
      <div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Cantidad de Participantes
  </label>
  <div className="flex items-stretch gap-2">
    <button
      type="button"
      onClick={() => setForm(prev => ({
        ...prev,
        formularioGrupos: {
          ...prev.formularioGrupos,
          cantidadParticipantes: Math.max(1, (prev.formularioGrupos.cantidadParticipantes ?? 1) - 1),
        }
      }))}
      className="px-3 rounded border bg-white hover:bg-gray-50"
    >−</button>

    <input
      type="number"
      min={1}
      step={1}
      value={form.formularioGrupos.cantidadParticipantes ?? 1}
      onChange={(e) => {
        const n = Math.max(1, Math.round(Number(e.target.value) || 1));
        setForm(prev => ({
          ...prev,
          formularioGrupos: { ...prev.formularioGrupos, cantidadParticipantes: n },
        }));
      }}
      className="border rounded px-3 py-2 w-24 text-center"
      required
    />

    <button
      type="button"
      onClick={() => setForm(prev => ({
        ...prev,
        formularioGrupos: {
          ...prev.formularioGrupos,
          cantidadParticipantes: Math.max(1, (prev.formularioGrupos.cantidadParticipantes ?? 1) + 1),
        }
      }))}
      className="px-3 rounded border bg-white hover:bg-gray-50"
    >+</button>
  </div>
  <p className="text-xs text-gray-500 mt-1">Se usará en el formulario público.</p>
</div>


      {/* Preguntas Personalizadas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-md font-medium text-gray-700">Preguntas Personalizadas</h5>
          <span className="text-xs text-gray-500">{form.formularioGrupos.preguntasPersonalizadas.length}/10</span>
        </div>

        {/* Lista existentes */}
        <div className="space-y-3 mb-4">
          {form.formularioGrupos.preguntasPersonalizadas.map((pregunta, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">{pregunta.titulo}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {pregunta.tipo} {pregunta.requerida && '(requerido)'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setNuevaPregunta({ ...pregunta }); setEditandoPregunta(index); }}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        formularioGrupos: {
                          ...prev.formularioGrupos,
                          preguntasPersonalizadas: prev.formularioGrupos.preguntasPersonalizadas.filter((_, i) => i !== index),
                        },
                      }));
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Eliminar"
                  >
                    ×
                  </button>
                </div>
              </div>
              {pregunta.opciones?.length > 0 && (
                <div className="text-xs text-gray-600">Opciones: {pregunta.opciones.join(', ')}</div>
              )}
            </div>
          ))}
        </div>

        {/* Form agregar/editar */}
        {form.formularioGrupos.preguntasPersonalizadas.length < 10 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h6 className="text-sm font-medium text-gray-700 mb-3">
              {editandoPregunta !== null ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h6>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Título de la pregunta *</label>
                <input
                  type="text"
                  value={nuevaPregunta.titulo}
                  onChange={(e) => setNuevaPregunta(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Escribe tu pregunta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de respuesta</label>
                <select
                  value={nuevaPregunta.tipo}
                  onChange={(e) => {
                    setNuevaPregunta(prev => ({
                      ...prev,
                      tipo: e.target.value,
                      opciones: ['combobox', 'multiple', 'checklist'].includes(e.target.value) ? ['Opción 1'] : [],
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="abierta">Respuesta Abierta</option>
                  <option value="combobox">Lista Desplegable (Combobox)</option>
                  <option value="multiple">Opción Múltiple (Radio)</option>
                  <option value="checklist">Lista de Verificación (Checkbox)</option>
                </select>
              </div>

              {['combobox', 'multiple', 'checklist'].includes(nuevaPregunta.tipo) && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opciones</label>
                  <div className="space-y-2">
                    {nuevaPregunta.opciones.map((opcion, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={opcion}
                          onChange={(e) => {
                            const nuevas = [...nuevaPregunta.opciones];
                            nuevas[index] = e.target.value;
                            setNuevaPregunta(prev => ({ ...prev, opciones: nuevas }));
                          }}
                          placeholder={`Opción ${index + 1}`}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {nuevaPregunta.opciones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nuevas = nuevaPregunta.opciones.filter((_, i) => i !== index);
                              setNuevaPregunta(prev => ({ ...prev, opciones: nuevas }));
                            }}
                            className="px-2 py-1 text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {nuevaPregunta.opciones.length < 10 && (
                      <button
                        type="button"
                        onClick={() => setNuevaPregunta(prev => ({ ...prev, opciones: [...prev.opciones, `Opción ${prev.opciones.length + 1}`] }))}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + Agregar opción
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={nuevaPregunta.requerida}
                    onChange={(e) => setNuevaPregunta(prev => ({ ...prev, requerida: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700">Campo requerido</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!nuevaPregunta.titulo.trim()) return;
                    if (editandoPregunta !== null) {
                      setForm(prev => {
                        const np = [...prev.formularioGrupos.preguntasPersonalizadas];
                        np[editandoPregunta] = { ...nuevaPregunta };
                        return { ...prev, formularioGrupos: { ...prev.formularioGrupos, preguntasPersonalizadas: np } };
                      });
                      setEditandoPregunta(null);
                    } else {
                      setForm(prev => ({
                        ...prev,
                        formularioGrupos: {
                          ...prev.formularioGrupos,
                          preguntasPersonalizadas: [...prev.formularioGrupos.preguntasPersonalizadas, { ...nuevaPregunta }],
                        },
                      }));
                    }
                    setNuevaPregunta({ titulo: '', tipo: 'abierta', requerida: false, opciones: [] });
                  }}
                  disabled={!nuevaPregunta.titulo.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editandoPregunta !== null ? 'Actualizar' : 'Agregar'}
                </button>
                {editandoPregunta !== null && (
                  <button
                    type="button"
                    onClick={() => { setEditandoPregunta(null); setNuevaPregunta({ titulo: '', tipo: 'abierta', requerida: false, opciones: [] }); }}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Vista previa lista de campos */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h6 className="text-sm font-medium text-gray-700 mb-3">Vista Previa del Formulario</h6>
        <div className="space-y-3 text-sm">
          {form.formularioGrupos.camposPreestablecidos.nombreEquipo && (
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Nombre del Equipo (requerido)
            </div>
          )}
          {form.formularioGrupos.camposPreestablecidos.nombreLider && (
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Nombre del Líder del Equipo (requerido)
            </div>
          )}
          {form.formularioGrupos.camposPreestablecidos.contactoEquipo && (
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Contacto del Equipo (requerido)
            </div>
          )}
          {form.formularioGrupos.camposPreestablecidos.categoria && (
            <div className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Categoría (requerido)
            </div>
          )}
          {form.formularioGrupos.camposPreestablecidos.cantidadParticipantes && (
           <div className="flex items-center text-gray-600">
             <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            Cantidad de Participantes (requerido)
          </div>
          )}
          {form.formularioGrupos.preguntasPersonalizadas.map((pregunta, index) => (
            <div key={index} className="flex items-center text-gray-600">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              {pregunta.titulo} ({pregunta.tipo}){pregunta.requerida && ' *'}
              {pregunta.opciones?.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">({pregunta.opciones.length} opciones)</span>
              )}
            </div>
          ))}
          {form.formularioGrupos.camposPreestablecidos.nombreEquipo === false &&
           form.formularioGrupos.camposPreestablecidos.nombreLider === false &&
           form.formularioGrupos.camposPreestablecidos.contactoEquipo === false &&
           form.formularioGrupos.camposPreestablecidos.categoria === false &&
           form.formularioGrupos.preguntasPersonalizadas.length === 0 && (
            <div className="text-gray-400 italic">No hay campos configurados</div>
          )}
        </div>
      </div>
    </div>
  );
}
