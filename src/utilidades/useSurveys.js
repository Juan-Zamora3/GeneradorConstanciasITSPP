import { useState, useCallback } from 'react';
import { db } from '../servicios/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query, 
  where,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

const ENCUESTAS = 'encuestas';

/* ---------------- utils ---------------- */
function detectHashBase() {
  const usesHashRouter =
    typeof window !== 'undefined' && window.location.hash?.startsWith('#/');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return origin + (usesHashRouter ? '/#' : '');
}
function slugify(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
async function pickSlug(baseSlug) {
  const candidate = slugify(baseSlug || 'formulario');
  const q1 = query(
    collection(db, ENCUESTAS),
    where('linkSlug', '==', candidate),
    limit(1)
  );
  const snap = await getDocs(q1);
  if (snap.empty) return candidate;

  const ts = Date.now().toString(36).slice(-4);
  return `${candidate}-${ts}`;
}

/* --------------- funciones planas (no hooks) --------------- */

export async function getById(encuestaId) {
  const ref = doc(db, ENCUESTAS, encuestaId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getByCourse(cursoId) {
  const q = query(collection(db, ENCUESTAS), where('cursoId', '==', cursoId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBySlug(slug) {
  const q = query(
    collection(db, ENCUESTAS),
    where('linkSlug', '==', slug),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function createForCourse({
  cursoId,
  titulo,
  preguntas = [],
  user,
  slug, // opcional
  theme, // opcional: { headerTitle, headerDescription, backgroundImage, ... }
  descripcion, // opcional
  cantidadParticipantes = 1,
  camposPreestablecidos = {
    nombreEquipo: true,
    nombreLider: true,
    contactoEquipo: true,
    categoria: true,
    cantidadParticipantes: true,
  },
  categorias = [],
}) {
  const base = detectHashBase();

  const cats = Array.from(
    new Set(categorias.map((c) => (c || '').trim()).filter(Boolean))
  );

  // 1) documento base
  const ref = await addDoc(collection(db, ENCUESTAS), {
    cursoId: cursoId || null,
    titulo: titulo || 'Registro de Grupos',
    descripcion: descripcion || '',
    preguntas,
    cantidadParticipantes,
    camposPreestablecidos,
    formularioGrupos: { cantidadParticipantes, categorias: cats },
    creadoPor: user?.uid || null,
    creadoEn: serverTimestamp(),
  });

  // 2) slug y enlaces
  const linkSlug = await pickSlug(slug || titulo || 'registro');
  const linkById = `${base}/registro/${ref.id}`;
  const linkBySlug = `${base}/${linkSlug}`;

  const patch = {
    link: linkById, // compat con ruta antigua
    linkSlug,
    linkBySlug,
  };
  if (theme && typeof theme === 'object') {
    patch.theme = theme; // guarda apariencia inicial (incluye headerTitle/Description, colores, backgroundImage en base64, etc.)
  }

  await updateDoc(ref, patch);
  return { id: ref.id, link: linkById, linkBySlug, linkSlug };
}

export async function saveResponse(encuestaId, payload) {
  // payload: { preset: {...}, custom: {...}, createdAt?: Date }
  const sub = collection(doc(db, ENCUESTAS, encuestaId), 'respuestas');
  await addDoc(sub, {
    ...payload,
    submittedAt: serverTimestamp(),
  });
}

export async function updateSurvey(encuestaId, patch) {
  await updateDoc(doc(db, ENCUESTAS, encuestaId), patch);
}

/**
 * Guarda apariencia dentro de `theme`.
 * - themePatch: { headerTitle, headerDescription, backgroundColor, titleColor, textColor, overlayOpacity, ... }
 * - bgDataUrl:  Data URL para theme.backgroundImage (sin Storage)
 * - removeBg:   true para borrar fondo
 */
export async function updateSurveyTheme(
  encuestaId,
  themePatch = {},
  { bgDataUrl, removeBg } = {}
) {
  const updates = {};
  Object.entries(themePatch || {}).forEach(([k, v]) => {
    updates[`theme.${k}`] = v;
  });

  if (bgDataUrl) {
    updates['theme.backgroundImage'] = bgDataUrl;
    updates['theme.bgVersion'] = Date.now();
  } else if (removeBg) {
    updates['theme.backgroundImage'] = null;
    updates['theme.bgVersion'] = Date.now();
  }

  await updateDoc(doc(db, ENCUESTAS, encuestaId), updates);
}

/**
 * Reasigna el slug y actualiza el link por slug (mantiene link por id).
 */
export async function setSurveySlug(encuestaId, desiredSlug) {
  const base = detectHashBase();
  const linkSlug = await pickSlug(desiredSlug);
  const linkBySlug = `${base}/${linkSlug}`;
  await updateDoc(doc(db, ENCUESTAS, encuestaId), { linkSlug, linkBySlug });
  return { linkSlug, linkBySlug };
}

/* --------------- hook (envoltura con loading) --------------- */

export function useSurveys() {
  const [loading, setLoading] = useState(false);

  const _getByCourse = useCallback(async (cursoId) => getByCourse(cursoId), []);
  const _getById = useCallback(async (encuestaId) => getById(encuestaId), []);
  const _getBySlug = useCallback(async (slug) => getBySlug(slug), []);

  const _createForCourse = useCallback(async (opts) => {
    setLoading(true);
    try {
      return await createForCourse(opts);
    } finally {
      setLoading(false);
    }
  }, []);

  const _saveResponse = useCallback(
    async (encuestaId, payload) => saveResponse(encuestaId, payload),
    []
  );

  const _updateSurvey = useCallback(async (encuestaId, patch) => {
    setLoading(true);
    try {
      await updateSurvey(encuestaId, patch);
    } finally {
      setLoading(false);
    }
  }, []);

  const _updateSurveyTheme = useCallback(
    async (encuestaId, themePatch, opts) => {
      setLoading(true);
      try {
        await updateSurveyTheme(encuestaId, themePatch, opts);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const _setSurveySlug = useCallback(async (encuestaId, desiredSlug) => {
    setLoading(true);
    try {
      return await setSurveySlug(encuestaId, desiredSlug);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    // lecturas
    getByCourse: _getByCourse,
    getById: _getById,
    getBySlug: _getBySlug,
    // escrituras/creaciones
    createForCourse: _createForCourse,
    saveResponse: _saveResponse,
    updateSurvey: _updateSurvey,
    updateSurveyTheme: _updateSurveyTheme,
    setSurveySlug: _setSurveySlug,
  };
}
