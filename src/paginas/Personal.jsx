
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexto/AuthContext';
import { useParticipants } from '../utilidades/useParticipants';
import ParticipantList from '../componentes/PantallaPersonal/ParticipantList';
import NewEditParticipantModal    from '../componentes/PantallaPersonal/NewEditParticipantModal';
import DetailsParticipantModal    from '../componentes/PantallaPersonal/DetailsParticipantModal';
import DeleteParticipantModal     from '../componentes/PantallaPersonal/DeleteParticipantModal';

export default function Personal() {
  const { usuario } = useContext(AuthContext);
  const navigate    = useNavigate();
  const {
    participants, loading, error,
    addParticipant, updateParticipant, deleteParticipant
  } = useParticipants();

  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('nombre');
  const [filterByArea, setFilterByArea] = useState('');

  const [modalType, setModalType] = useState(null); // 'new'|'edit'|'details'|'delete'
  const [selected, setSelected]   = useState(null);

  // redirigir si no logueado
  if (!usuario) {
    navigate('/login',{replace:true});
    return null;
  }

  // handlers de modales
  const open = (type, p=null) => { setSelected(p); setModalType(type); };
  const close= () => { setSelected(null); setModalType(null); };

  const handleSubmit = async data => {
    try {
      if (modalType==='new')  await addParticipant(data);
      if (modalType==='edit') await updateParticipant(selected.id,data);
      close();
    } catch(err) { alert(err.message); }
  };

  const handleDelete = async () => {
    try { await deleteParticipant(selected.id); close(); }
    catch(err){ alert(err.message); }
  };

  // filtrado y orden
  const list = participants
    .filter(p=>{
      const term = search.toLowerCase();
      return (
        (`${p.nombre} ${p.apellidos}`.toLowerCase().includes(term))||
        p.correo.toLowerCase().includes(term)||
        p.area.toLowerCase().includes(term)
      );
    })
    .filter(p => filterByArea ? p.area.toLowerCase().includes(filterByArea.toLowerCase()) : true)
    .sort((a,b)=>{
      if (sortBy==='nombre') return (`${a.nombre} ${a.apellidos}`)
        .localeCompare(`${b.nombre} ${b.apellidos}`);
      if (sortBy==='nombre-desc') return (`${b.nombre} ${b.apellidos}`)
        .localeCompare(`${a.nombre} ${a.apellidos}`);
      if (sortBy==='area') return a.area.localeCompare(b.area);
      return 0;
    });

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Gestión de Participantes</h2>
        <button onClick={()=>open('new')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4 md:mt-0">
          <i className="ri-user-add-line mr-2"></i>Nuevo
        </button>
      </header>

      {/* filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text" placeholder="Buscar..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-4 py-2">
          <option value="nombre">A–Z</option>
          <option value="nombre-desc">Z–A</option>
          <option value="area">Área</option>
        </select>
        <select value={filterByArea} onChange={e=>setFilterByArea(e.target.value)}
          className="w-full sm:w-48 border border-gray-300 rounded-md px-4 py-2">
          <option value="">Todas las áreas</option>
          {[...new Set(participants.map(p=>p.area).filter(a=>a))].map(a=>(
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_,i)=>
              <div key={i} className="bg-white rounded-xl shadow p-6 h-48 animate-pulse"/>
            )}
          </div>
        : <ParticipantList
            participants={list}
            onView={p=>open('details',p)}
            onEdit={p=>open('edit',p)}
            onDelete={p=>open('delete',p)}
          />
      }

      {/* modales */}
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
    </div>
  );
}
