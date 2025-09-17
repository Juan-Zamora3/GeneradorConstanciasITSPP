// src/paginas/Personal.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { toast, ToastContainer } from 'react-toastify';   // 🆕
import 'react-toastify/dist/ReactToastify.css';           // 🆕 estilos rápidos
import { AuthContext } from '../contexto/AuthContext';
import { useParticipants } from '../utilidades/useParticipants';
import { listToWorkbook, fileToList } from '../utilidades/excelHelpers';
import { LOGIN_PATH } from '../utilidades/rutasConfig';

import ParticipantList from '../componentes/PantallaPersonal/ParticipantList';
import NewEditParticipantModal from '../componentes/PantallaPersonal/NewEditParticipantModal';
import DetailsParticipantModal from '../componentes/PantallaPersonal/DetailsParticipantModal';
import DeleteParticipantModal from '../componentes/PantallaPersonal/DeleteParticipantModal';

/* ------------------ VALIDACIÓN REUTILIZABLE ------------------ */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateParticipant(part) {
  const errs = [];
  if (!part.nombre?.trim())       errs.push('El nombre es obligatorio');
  if (!part.apellidos?.trim())    errs.push('Los apellidos son obligatorios');
  if (!emailRegex.test(part.correo || ''))
    errs.push('El correo no es válido');
  if (!part.area?.trim())         errs.push('El área es obligatoria');
  // agrega más reglas si lo necesitas (teléfono, etc.)
  return errs;
}

export default function Personal() {
  const { usuario } = useContext(AuthContext);
  const navigate    = useNavigate();
  const {
    participants, loading,
    addParticipant, updateParticipant, deleteParticipant
  } = useParticipants();

  /* ---------- estado ui ---------- */
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('nombre');
  const [filterByArea, setFilterByArea] = useState('');
  const [modalType, setModalType]   = useState(null); // 'new'|'edit'|'details'|'delete'
  const [selected,   setSelected]   = useState(null);

  /* ---------- refs ---------- */
  const importInput = useRef(null);

  /* ---------- export / import ---------- */
  const exportFile = (fileName='Participantes.xlsx', list=participants) => {
    const wb = listToWorkbook(list);
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
    toast.success('Excel exportado');    // 🆕 feedback
  };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await fileToList(file);

      let errores = 0, nuevos = 0, actualizados = 0;
      for (const row of rows) {
        const fails = validateParticipant(row);
        if (fails.length) { errores++; continue; }

        const exists = participants.find(p => p.correo === row.correo);
        if (exists) {
          await updateParticipant(exists.id, row);
          actualizados++;
        } else {
          await addParticipant(row);
          nuevos++;
        }
      }

      toast.success(`Importación lista • ${nuevos} nuevos • ${actualizados} actualizados${errores ? ` • ${errores} con error` : ''}`);
      if (errores) toast.warn('Revisa el archivo, hay filas con datos faltantes o correo inválido');
    } catch (err) {
      console.error(err);
      toast.error('Error al importar archivo');
    }
    e.target.value = ''; // reset input
  };

  /* ---------- export automático mensual ---------- */
  useEffect(() => {
    if (!participants.length) return;
    const today = new Date();
    if (today.getDate() !== 1) return;
    const key = 'lastParticipantExport';
    const currentKeyVal = `${today.getFullYear()}-${today.getMonth()}`;
    if (localStorage.getItem(key) === currentKeyVal) return;

    const fileName = `Participantes-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}.xlsx`;
    exportFile(fileName);
    localStorage.setItem(key, currentKeyVal);
  }, [participants]);

  /* ---------- seguridad ---------- */
  if (!usuario) { navigate(LOGIN_PATH, { replace:true }); return null; }

  /* ---------- handlers modales ---------- */
  const open  = (type,p=null)=>{ setSelected(p); setModalType(type); };
  const close = ()            =>{ setSelected(null); setModalType(null); };

  const handleSubmit = async data => {
    const fails = validateParticipant(data);
    if (fails.length) { toast.error(fails.join('\n')); return; }

    try {
      if (modalType==='new')  await addParticipant(data);
      if (modalType==='edit') await updateParticipant(selected.id,data);
      toast.success('Participante guardado');
      close();
    } catch(err){
      toast.error(err.message);
    }
  };
  const handleDelete = async () => {
    try {
      await deleteParticipant(selected.id);
      toast.info('Participante eliminado');
      close();
    } catch(err){
      toast.error(err.message);
    }
  };

  /* ---------- filtrado y orden ---------- */
  const list = participants
    .filter(p=>{
      const term = search.toLowerCase();
      return (`${p.nombre} ${p.apellidos}`.toLowerCase().includes(term) ||
              p.correo.toLowerCase().includes(term) ||
              p.area.toLowerCase().includes(term));
    })
    .filter(p => filterByArea ? p.area.toLowerCase().includes(filterByArea.toLowerCase()) : true)
    .sort((a,b)=>{
      if (sortBy==='nombre')      return (`${a.nombre} ${a.apellidos}`).localeCompare(`${b.nombre} ${b.apellidos}`);
      if (sortBy==='nombre-desc') return (`${b.nombre} ${b.apellidos}`).localeCompare(`${a.nombre} ${a.apellidos}`);
      if (sortBy==='area')        return a.area.localeCompare(b.area);
      return 0;
    });

  /* ---------- render ---------- */
  return (
    <div className="p-6 space-y-6">
      {/* CABECERA */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Gestión de Participantes</h2>

        <div className="flex flex-wrap gap-3">
          {/* IMPORTAR */}
          <button
            onClick={()=>importInput.current?.click()}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 flex items-center"
          >
            <i className="ri-upload-2-line mr-2"></i>Importar Excel
          </button>
          <input
            ref={importInput} type="file" accept=".xlsx,.xls"
            onChange={handleImport} className="hidden"
          />

          {/* EXPORTAR */}
          <button
            onClick={()=>exportFile()}
            className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center"
          >
            <i className="ri-download-2-line mr-2"></i>Exportar Excel
          </button>

          {/* NUEVO */}
          <button
            onClick={()=>open('new')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
          >
            <i className="ri-user-add-line mr-2"></i>Nuevo
          </button>
        </div>
      </header>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* buscador */}
        <div className="relative flex-1">
          <input
            type="text" placeholder="Buscar..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
        </div>
        {/* orden */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-4 py-2">
          <option value="nombre">A–Z</option>
          <option value="nombre-desc">Z–A</option>
          <option value="area">Área</option>
        </select>
        {/* área */}
        <select value={filterByArea} onChange={e=>setFilterByArea(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-4 py-2">
          <option value="">Todas las áreas</option>
          {[...new Set(participants.map(p=>p.area).filter(Boolean))].map(a=>(
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* LISTA o placeholders */}
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_,i)=>
              <div key={i} className="bg-white rounded-xl shadow p-6 h-48 animate-pulse" />
            )}
          </div>
        : <ParticipantList
            participants={list}
            onView={p=>open('details',p)}
            onEdit={p=>open('edit',p)}
            onDelete={p=>open('delete',p)}
          />
      }

      {/* MODALES */}
      <NewEditParticipantModal
        isOpen={modalType==='new'||modalType==='edit'}
        onClose={close}
        onSubmit={handleSubmit}
        initialData={modalType==='edit'?selected:null}
      />
      <DetailsParticipantModal
        isOpen={modalType==='details'}
        participant={selected}
        onClose={close}
      />
      <DeleteParticipantModal
        isOpen={modalType==='delete'}
        participant={selected}
        onCancel={close}
        onConfirm={handleDelete}
      />

      {/* ALERTAS GLOBAL */}
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"   // 🌈 ligero contraste
      />
    </div>
  );
}
