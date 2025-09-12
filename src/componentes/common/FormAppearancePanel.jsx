import React from 'react';
import { useFormAppearance } from '@/utilidades/useFormAppearance';

export default function FormAppearancePanel({ formId, onSaved }) {
  const { appearance, setField, setBgImageFile, save, loading, DEFAULTS } =
    useFormAppearance(formId);

  const handleOverlay = (e) => {
    const v = parseFloat(e.target.value);
    const clamped = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.35;
    setField('overlay', clamped);
  };

  const resetAll = () => {
    setField('bgColor', DEFAULTS.bgColor);
    setField('titleColor', DEFAULTS.titleColor);
    setField('textColor', DEFAULTS.textColor);
    setField('overlay', DEFAULTS.overlay);
    setField('bgImageUrl', '');
  };

  const previewStyle = {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 180,
    backgroundColor: appearance.bgColor,
    backgroundImage: appearance.bgImageUrl ? `url("${appearance.bgImageUrl}")` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div key={formId}>
      <div className="grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <label>
          <div>Color de fondo</div>
          <input type="color" value={appearance.bgColor}
                 onChange={e => setField('bgColor', e.target.value)}
                 style={{ width:'100%', height:42 }} />
        </label>
        <label>
          <div>Imagen de fondo (desde tu equipo)</div>
          <input type="file" accept="image/*" onChange={e => setBgImageFile(e.target.files?.[0] || null)} />
        </label>

        <label>
          <div>Color del título</div>
          <input type="color" value={appearance.titleColor}
                 onChange={e => setField('titleColor', e.target.value)}
                 style={{ width:'100%', height:42 }} />
        </label>

        <label>
          <div>Color del texto</div>
          <input type="color" value={appearance.textColor}
                 onChange={e => setField('textColor', e.target.value)}
                 style={{ width:'100%', height:42 }} />
        </label>

        <label style={{ gridColumn:'1 / -1' }}>
          <div>Opacidad del overlay (0–1)</div>
          <input type="number" step="0.01" min="0" max="1"
                 value={appearance.overlay}
                 onChange={handleOverlay}
                 style={{ width:'100%', height:42 }} />
        </label>
      </div>

      <div style={{ marginTop:16 }}>
        <div style={{ fontSize:12, color:'#6b7280', marginBottom:8 }}>Previsualización</div>
        <div style={previewStyle}>
          <div style={{
            position:'absolute', inset:0,
            background:`rgba(255,255,255,${appearance.overlay})`
          }} />
          <div style={{ position:'relative', padding:24, textAlign:'center' }}>
            <h4 style={{ color: appearance.titleColor, margin:0, fontSize:22, fontWeight:700 }}>
              Título de ejemplo
            </h4>
            <p style={{ color: appearance.textColor, margin:'8px 0 0 0' }}>
              Texto de ejemplo del formulario
            </p>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button onClick={async () => { await save(); onSaved?.(); }} disabled={loading}>
          Guardar apariencia
        </button>
        <button type="button" onClick={resetAll}>Restablecer</button>
      </div>
    </div>
  );
}
