import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Trash2, Image as ImageIcon, X as XIcon } from 'lucide-react'
import { useTopbar } from '@/context/TopbarContext'
import { savesApi } from '@/api/saves.api'
import type { FurnitureSave, SaveCutRequest } from '@/types/saves.types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import MaterialDialog, { type MaterialFormData } from '@/components/ui/MaterialDialog'
import styles from './SavesPage.module.css'

function isCutRowValid(row: CutRow) {
  return (
    row.materialName.trim().length > 0 &&
    parseInt(row.lengthMm, 10) > 0 &&
    parseInt(row.widthMm, 10) > 0
  )
}

interface CutRow {
  materialName: string
  lengthMm: string
  widthMm: string
  heightMm: string
  quantity: string
  notes: string
}

const emptyCutRow = (): CutRow => ({
  materialName: '',
  lengthMm: '',
  widthMm: '',
  heightMm: '',
  quantity: '1',
  notes: '',
})

const SavesPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [saveName, setSaveName]     = useState('')
  const [saveDesc, setSaveDesc]     = useState('')

  const [editSave, setEditSave]     = useState<FurnitureSave | null>(null)

  const [selectedSave, setSelectedSave] = useState<FurnitureSave | null>(null)

  // Material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)

  // Single-cut edit modal
  const [editingCut, setEditingCut] = useState<FurnitureSave['cuts'][0] | null>(null)
  const [editCutForm, setEditCutForm] = useState<CutRow>(emptyCutRow())

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: resp, isLoading } = useQuery({
    queryKey: ['saves'],
    queryFn: savesApi.getAll,
  })

  const saves: FurnitureSave[] = resp?.data?.data ?? []

  const createMut = useMutation({
    mutationFn: savesApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setCreateOpen(false)
      setSaveName('')
      setSaveDesc('')
      setSelectedSave(res.data.data)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name: string; description?: string } }) =>
      savesApi.update(id, body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
      setEditSave(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: savesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(null)
    },
  })

  const addCutMut = useMutation({
    mutationFn: ({ saveId, body }: { saveId: string; body: SaveCutRequest }) =>
      savesApi.addCut(saveId, body),
  })

  const updateCutMut = useMutation({
    mutationFn: ({ saveId, cutId, body }: { saveId: string; cutId: string; body: SaveCutRequest }) =>
      savesApi.updateCut(saveId, cutId, body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
      setEditingCut(null)
    },
  })

  const removeCutMut = useMutation({
    mutationFn: ({ saveId, cutId }: { saveId: string; cutId: string }) =>
      savesApi.removeCut(saveId, cutId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
    },
  })

  const uploadImageMut = useMutation({
    mutationFn: ({ saveId, file }: { saveId: string; file: File }) =>
      savesApi.uploadImage(saveId, file),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
    },
  })

  const deleteImageMut = useMutation({
    mutationFn: ({ saveId, imageId }: { saveId: string; imageId: string }) =>
      savesApi.deleteImage(saveId, imageId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
    },
  })

  useEffect(() => {
    setTitle('Saqlangan shablonlar')
    setActions(
      <Button size="sm" onClick={() => setCreateOpen(true)}>+ Yangi shablon</Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  useEffect(() => {
    if (selectedSave && saves.length > 0) {
      const updated = saves.find((s) => s.id === selectedSave.id)
      if (updated) setSelectedSave(updated)
    }
  }, [saves])

  const handleMaterialAdd = async (data: MaterialFormData) => {
    if (!selectedSave) return

    // Convert cm to mm if needed
    const lengthMm = data.unit === 'cm' ? parseFloat(data.lengthValue) * 10 : parseFloat(data.lengthValue)
    const widthMm = data.unit === 'cm' ? parseFloat(data.widthValue) * 10 : parseFloat(data.widthValue)
    const heightMm = data.heightValue ? (data.unit === 'cm' ? parseFloat(data.heightValue) * 10 : parseFloat(data.heightValue)) : undefined

    const body: SaveCutRequest = {
      materialName: data.materialName.trim(),
      lengthMm: Math.round(lengthMm),
      widthMm: Math.round(widthMm),
      heightMm: heightMm ? Math.round(heightMm) : undefined,
      quantity: parseInt(data.quantity, 10) || 1,
      notes: data.notes?.trim() || undefined,
    }

    await addCutMut.mutateAsync({ saveId: selectedSave.id, body })
    queryClient.invalidateQueries({ queryKey: ['saves'] })
    setMaterialDialogOpen(false)
  }

  const openEditCut = (cut: FurnitureSave['cuts'][0]) => {
    setEditingCut(cut)
    setEditCutForm({
      materialName: cut.materialName,
      lengthMm: String(cut.lengthMm),
      widthMm: String(cut.widthMm),
      heightMm: cut.heightMm != null ? String(cut.heightMm) : '',
      quantity: String(cut.quantity),
      notes: cut.notes ?? '',
    })
  }


  const handleEditCutSave = () => {
    if (!selectedSave || !editingCut) return
    const body: SaveCutRequest = {
      materialName: editCutForm.materialName,
      lengthMm: parseInt(editCutForm.lengthMm, 10),
      widthMm: parseInt(editCutForm.widthMm, 10),
      heightMm: editCutForm.heightMm ? parseInt(editCutForm.heightMm, 10) : undefined,
      quantity: editCutForm.quantity ? parseInt(editCutForm.quantity, 10) : 1,
      notes: editCutForm.notes || undefined,
    }
    updateCutMut.mutate({ saveId: selectedSave.id, cutId: editingCut.id, body })
  }


  return (
    <div className={styles.page}>
      {/* Left: saves list */}
      <div className={styles.sidebar}>
        {isLoading ? (
          <div className={styles.loading}>Yuklanmoqda...</div>
        ) : saves.length === 0 ? (
          <div className={styles.empty}>
            <p>Hali hech qanday shablon yo'q</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>+ Yangi shablon</Button>
          </div>
        ) : (
          saves.map((s) => (
            <div
              key={s.id}
              className={`${styles.saveItem} ${selectedSave?.id === s.id ? styles.saveItemActive : ''}`}
              onClick={() => setSelectedSave(s)}
            >
              <div className={styles.saveItemName}>{s.name}</div>
              <div className={styles.saveItemMeta}>
                {s.cuts.length} ta kesim · {(s.images ?? []).length}/3 rasm
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right: detail */}
      <div className={styles.detail}>
        {!selectedSave ? (
          <div className={styles.noSelection}>
            <p>Chap tomondagi shablonni tanlang</p>
          </div>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>{selectedSave.name}</h2>
                {selectedSave.description && (
                  <p className={styles.detailDesc}>{selectedSave.description}</p>
                )}
              </div>
              <div className={styles.detailActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => {
                    setEditSave(selectedSave)
                    setSaveName(selectedSave.name)
                    setSaveDesc(selectedSave.description ?? '')
                  }}
                  title="Tahrirlash"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => {
                    if (confirm(`"${selectedSave.name}" ni o'chirishni tasdiqlaysizmi?`)) {
                      deleteMut.mutate(selectedSave.id)
                    }
                  }}
                  title="O'chirish"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Images section */}
            <div className={styles.cutsSection} style={{ marginBottom: 16 }}>
              <div className={styles.cutsHeader}>
                <span className={styles.cutsTitle}>
                  <ImageIcon size={16} style={{ display: 'inline-block', marginRight: 6 }} />
                  Rasmlar ({(selectedSave.images ?? []).length}/3)
                </span>
                {(selectedSave.images ?? []).length < 3 && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadImageMut.mutate({ saveId: selectedSave.id, file })
                        e.target.value = ''
                      }}
                    />
                    <Button
                      size="sm"
                      loading={uploadImageMut.isPending}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      + Rasm yuklash
                    </Button>
                  </>
                )}
              </div>
              <div className={styles.imageGrid}>
                {(selectedSave.images ?? []).length === 0 ? (
                  <p className={styles.noCuts}>Rasm yuklanmagan</p>
                ) : (
                  (selectedSave.images ?? []).map((img) => (
                    <div key={img.id} className={styles.imageItem}>
                      <img
                        src={img.url}
                        alt={img.originalFilename}
                        className={styles.imageThumbnail}
                        onClick={() => setLightboxUrl(img.url)}
                      />
                      <button
                        type="button"
                        className={styles.imageDelete}
                        onClick={() => deleteImageMut.mutate({ saveId: selectedSave.id, imageId: img.id })}
                        title="O'chirish"
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cuts table */}
            <div className={styles.cutsSection}>
              <div className={styles.cutsHeader}>
                <span className={styles.cutsTitle}>Kesimlar ro'yxati</span>
                <Button size="sm" onClick={() => setMaterialDialogOpen(true)}>+ Kesim qo'shish</Button>
              </div>

              {selectedSave.cuts.length === 0 ? (
                <div className={styles.noCuts}>
                  Hali kesim qo'shilmagan. "Kesim qo'shish" tugmasini bosing.
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Material nomi</th>
                        <th>Bo'yi (mm)</th>
                        <th>Eni (mm)</th>
                        <th>Balandligi (mm)</th>
                        <th>Soni</th>
                        <th>Izoh</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSave.cuts.map((cut, idx) => (
                        <tr key={cut.id}>
                          <td className={styles.numCell}>{idx + 1}</td>
                          <td className={styles.nameCell}>{cut.materialName}</td>
                          <td>{cut.lengthMm}</td>
                          <td>{cut.widthMm}</td>
                          <td>{cut.heightMm ?? '—'}</td>
                          <td>
                            <span className={styles.qtyBadge}>{cut.quantity}</span>
                          </td>
                          <td className={styles.notesCell}>{cut.notes ?? '—'}</td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.rowBtn}
                                onClick={() => openEditCut(cut)}
                                title="Tahrirlash"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                                onClick={() => {
                                  if (confirm(`"${cut.materialName}" kesimini o'chirishni tasdiqlaysizmi?`)) {
                                    removeCutMut.mutate({ saveId: selectedSave.id, cutId: cut.id })
                                  }
                                }}
                                disabled={removeCutMut.isPending}
                                title="O'chirish"
                              >
                                <XIcon size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create save modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setSaveName(''); setSaveDesc('') }}
        title="Yangi shablon yaratish"
      >
        <div className={styles.form}>
          <label className={styles.label}>Shablon nomi *</label>
          <input
            className={styles.input}
            placeholder="Masalan: Shkaf, Divon, Stol..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <label className={styles.label}>Tavsif (ixtiyoriy)</label>
          <textarea
            className={styles.textarea}
            placeholder="Qo'shimcha ma'lumot..."
            value={saveDesc}
            onChange={(e) => setSaveDesc(e.target.value)}
            rows={3}
          />
          <div className={styles.formActions}>
            <Button
              variant="primary"
              disabled={!saveName.trim() || createMut.isPending}
              onClick={() => createMut.mutate({ name: saveName.trim(), description: saveDesc.trim() || undefined })}
            >
              {createMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit save modal */}
      <Modal
        isOpen={!!editSave}
        onClose={() => setEditSave(null)}
        title="Shablonni tahrirlash"
      >
        <div className={styles.form}>
          <label className={styles.label}>Shablon nomi *</label>
          <input
            className={styles.input}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <label className={styles.label}>Tavsif (ixtiyoriy)</label>
          <textarea
            className={styles.textarea}
            value={saveDesc}
            onChange={(e) => setSaveDesc(e.target.value)}
            rows={3}
          />
          <div className={styles.formActions}>
            <Button
              variant="primary"
              disabled={!saveName.trim() || updateMut.isPending}
              onClick={() =>
                editSave && updateMut.mutate({
                  id: editSave.id,
                  body: { name: saveName.trim(), description: saveDesc.trim() || undefined },
                })
              }
            >
              {updateMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Material add dialog */}
      <MaterialDialog
        isOpen={materialDialogOpen}
        onClose={() => setMaterialDialogOpen(false)}
        onSave={handleMaterialAdd}
        isLoading={addCutMut.isPending}
        title="Kesim qo'shish"
      />

      {/* Edit single cut modal */}
      <Modal
        isOpen={!!editingCut}
        onClose={() => setEditingCut(null)}
        title="Kesimni tahrirlash"
      >
        <div className={styles.form}>
          <label className={styles.label}>Material nomi *</label>
          <input
            className={styles.input}
            placeholder="Masalan: LDSP, MDF, DSP..."
            value={editCutForm.materialName}
            onChange={(e) => setEditCutForm((f) => ({ ...f, materialName: e.target.value }))}
          />
          <div className={styles.dimRow}>
            <div className={styles.dimField}>
              <label className={styles.label}>Bo'yi (mm) *</label>
              <input
                className={styles.input}
                type="number"
                value={editCutForm.lengthMm}
                onChange={(e) => setEditCutForm((f) => ({ ...f, lengthMm: e.target.value }))}
              />
            </div>
            <div className={styles.dimField}>
              <label className={styles.label}>Eni (mm) *</label>
              <input
                className={styles.input}
                type="number"
                value={editCutForm.widthMm}
                onChange={(e) => setEditCutForm((f) => ({ ...f, widthMm: e.target.value }))}
              />
            </div>
            <div className={styles.dimField}>
              <label className={styles.label}>Balandligi (mm)</label>
              <input
                className={styles.input}
                type="number"
                value={editCutForm.heightMm}
                onChange={(e) => setEditCutForm((f) => ({ ...f, heightMm: e.target.value }))}
              />
            </div>
          </div>
          <label className={styles.label}>Soni</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={editCutForm.quantity}
            onChange={(e) => setEditCutForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <label className={styles.label}>Izoh</label>
          <input
            className={styles.input}
            placeholder="Ixtiyoriy..."
            value={editCutForm.notes}
            onChange={(e) => setEditCutForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className={styles.formActions}>
            <Button
              variant="primary"
              disabled={!isCutRowValid(editCutForm) || updateCutMut.isPending}
              onClick={handleEditCutSave}
            >
              {updateCutMut.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            className={styles.lightboxImage}
            alt="rasm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default SavesPage
