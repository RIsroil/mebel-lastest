import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTopbar } from '@/context/TopbarContext'
import { savesApi } from '@/api/saves.api'
import type { FurnitureSave, SaveCutRequest } from '@/types/saves.types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from './SavesPage.module.css'

interface CutForm {
  materialName: string
  lengthMm: string
  widthMm: string
  heightMm: string
  quantity: string
  notes: string
}

const emptyCutForm = (): CutForm => ({
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

  const [createOpen, setCreateOpen]   = useState(false)
  const [saveName, setSaveName]       = useState('')
  const [saveDesc, setSaveDesc]       = useState('')

  const [editSave, setEditSave]       = useState<FurnitureSave | null>(null)

  const [selectedSave, setSelectedSave] = useState<FurnitureSave | null>(null)
  const [cutFormOpen, setCutFormOpen]   = useState(false)
  const [editingCutId, setEditingCutId] = useState<string | null>(null)
  const [cutForm, setCutForm]           = useState<CutForm>(emptyCutForm())

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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
      setCutFormOpen(false)
      setCutForm(emptyCutForm())
      setEditingCutId(null)
    },
  })

  const updateCutMut = useMutation({
    mutationFn: ({ saveId, cutId, body }: { saveId: string; cutId: string; body: SaveCutRequest }) =>
      savesApi.updateCut(saveId, cutId, body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['saves'] })
      setSelectedSave(res.data.data)
      setCutFormOpen(false)
      setCutForm(emptyCutForm())
      setEditingCutId(null)
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

  useEffect(() => {
    setTitle('Saqlangan shablonlar')
    setActions(
      <Button size="sm" onClick={() => setCreateOpen(true)}>+ Yangi shablon</Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  // When saves reload, sync selectedSave
  useEffect(() => {
    if (selectedSave && saves.length > 0) {
      const updated = saves.find((s) => s.id === selectedSave.id)
      if (updated) setSelectedSave(updated)
    }
  }, [saves])

  const openAddCut = () => {
    setEditingCutId(null)
    setCutForm(emptyCutForm())
    setCutFormOpen(true)
  }

  const openEditCut = (cut: FurnitureSave['cuts'][0]) => {
    setEditingCutId(cut.id)
    setCutForm({
      materialName: cut.materialName,
      lengthMm: String(cut.lengthMm),
      widthMm: String(cut.widthMm),
      heightMm: cut.heightMm != null ? String(cut.heightMm) : '',
      quantity: String(cut.quantity),
      notes: cut.notes ?? '',
    })
    setCutFormOpen(true)
  }

  const handleCutSubmit = () => {
    if (!selectedSave) return
    const body: SaveCutRequest = {
      materialName: cutForm.materialName,
      lengthMm: parseInt(cutForm.lengthMm, 10),
      widthMm: parseInt(cutForm.widthMm, 10),
      heightMm: cutForm.heightMm ? parseInt(cutForm.heightMm, 10) : undefined,
      quantity: cutForm.quantity ? parseInt(cutForm.quantity, 10) : 1,
      notes: cutForm.notes || undefined,
    }
    if (editingCutId) {
      updateCutMut.mutate({ saveId: selectedSave.id, cutId: editingCutId, body })
    } else {
      addCutMut.mutate({ saveId: selectedSave.id, body })
    }
  }

  const cutFormValid =
    cutForm.materialName.trim().length > 0 &&
    !isNaN(parseInt(cutForm.lengthMm, 10)) &&
    !isNaN(parseInt(cutForm.widthMm, 10)) &&
    parseInt(cutForm.lengthMm, 10) > 0 &&
    parseInt(cutForm.widthMm, 10) > 0

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
                {s.cuts.length} ta kesim
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
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => {
                    if (confirm(`"${selectedSave.name}" ni o'chirishni tasdiqlaysizmi?`)) {
                      deleteMut.mutate(selectedSave.id)
                    }
                  }}
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Cuts table */}
            <div className={styles.cutsSection}>
              <div className={styles.cutsHeader}>
                <span className={styles.cutsTitle}>Kesimlar ro'yxati</span>
                <Button size="sm" onClick={openAddCut}>+ Kesim qo'shish</Button>
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
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                                onClick={() =>
                                  removeCutMut.mutate({ saveId: selectedSave.id, cutId: cut.id })
                                }
                                disabled={removeCutMut.isPending}
                              >
                                ✕
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

      {/* Add / edit cut modal */}
      <Modal
        isOpen={cutFormOpen}
        onClose={() => { setCutFormOpen(false); setCutForm(emptyCutForm()); setEditingCutId(null) }}
        title={editingCutId ? 'Kesimni tahrirlash' : 'Kesim qo\'shish'}
      >
        <div className={styles.form}>
          <label className={styles.label}>Material nomi *</label>
          <input
            className={styles.input}
            placeholder="Masalan: LDSP, MDF, DSP, Yog'och..."
            value={cutForm.materialName}
            onChange={(e) => setCutForm((f) => ({ ...f, materialName: e.target.value }))}
          />

          <div className={styles.dimRow}>
            <div className={styles.dimField}>
              <label className={styles.label}>Bo'yi (mm) *</label>
              <input
                className={styles.input}
                type="number"
                placeholder="2400"
                value={cutForm.lengthMm}
                onChange={(e) => setCutForm((f) => ({ ...f, lengthMm: e.target.value }))}
              />
            </div>
            <div className={styles.dimField}>
              <label className={styles.label}>Eni (mm) *</label>
              <input
                className={styles.input}
                type="number"
                placeholder="600"
                value={cutForm.widthMm}
                onChange={(e) => setCutForm((f) => ({ ...f, widthMm: e.target.value }))}
              />
            </div>
            <div className={styles.dimField}>
              <label className={styles.label}>Qalinligi (mm)</label>
              <input
                className={styles.input}
                type="number"
                placeholder="18"
                value={cutForm.heightMm}
                onChange={(e) => setCutForm((f) => ({ ...f, heightMm: e.target.value }))}
              />
            </div>
          </div>

          <label className={styles.label}>Soni *</label>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={cutForm.quantity}
            onChange={(e) => setCutForm((f) => ({ ...f, quantity: e.target.value }))}
          />

          <label className={styles.label}>Izoh (ixtiyoriy)</label>
          <input
            className={styles.input}
            placeholder="Qo'shimcha ma'lumot..."
            value={cutForm.notes}
            onChange={(e) => setCutForm((f) => ({ ...f, notes: e.target.value }))}
          />

          <div className={styles.formActions}>
            <Button
              variant="primary"
              disabled={!cutFormValid || addCutMut.isPending || updateCutMut.isPending}
              onClick={handleCutSubmit}
            >
              {(addCutMut.isPending || updateCutMut.isPending) ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SavesPage
