import React from 'react'
import { Rnd } from 'react-rnd'

export default function PreviewPane({
  previews,
  idxPrev,
  setIdxPrev,
  boxes,
  activeBox,
  updateBox,
  setActiveBox
}) {
  if (!previews.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Carga la plantilla, selecciona registros y pulsa **Previsualizar**…
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setIdxPrev(i => Math.max(0, i - 1))}
          disabled={idxPrev === 0}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ←
        </button>
        <span>
          {idxPrev + 1} / {previews.length}
        </span>
        <button
          onClick={() =>
            setIdxPrev(i =>
              Math.min(previews.length - 1, i + 1)
            )
          }
          disabled={idxPrev === previews.length - 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          →
        </button>
      </div>

      <div
        className="relative mt-2 w-[595px] h-[842px] border shadow overflow-auto bg-white"
        onClick={() => setActiveBox(null)}
      >
        <iframe
          src={previews[idxPrev]}
          title="preview"
          className="w-full h-full"
        />

        {Object.entries(boxes).map(([id, cfg]) => (
          <Rnd
            key={id}
            size={{ width: cfg.w, height: cfg.h }}
            position={{ x: cfg.x, y: cfg.y }}
            onDragStop={(_, d) =>
              updateBox(id, { ...cfg, x: d.x, y: d.y })
            }
            onResizeStop={(_, __, ref) =>
              updateBox(id, {
                ...cfg,
                w: ref.offsetWidth,
                h: ref.offsetHeight
              })
            }
            bounds="parent"
            lockAspectRatio={id === 'nombre'}
            enableResizing={id !== 'nombre'}
            style={{
              cursor: 'move',
              border:
                activeBox === id
                  ? '2px dashed #2563eb'
                  : 'none'
            }}
            onClick={e => {
              e.stopPropagation()
              setActiveBox(id)
            }}
          >
            <div
              style={{
                fontSize: cfg.size,
                fontWeight: cfg.bold ? 700 : 400,
                textAlign: cfg.align,
                color: cfg.color,
                whiteSpace: 'pre-wrap'
              }}
            >
              {cfg.preview}
            </div>
          </Rnd>
        ))}
      </div>
    </>
  )
}
