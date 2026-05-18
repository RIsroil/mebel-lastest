import { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './Button'
import styles from './MaterialDialog.module.css'

export type MaterialUnit = 'mm' | 'cm'

export interface MaterialFormData {
  materialName: string
  unit: MaterialUnit
  lengthValue: string
  widthValue: string
  heightValue?: string
  quantity: string
  notes?: string
}

interface MaterialDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: MaterialFormData) => void | Promise<void>
  isLoading?: boolean
  title?: string
}

const emptyForm = (): MaterialFormData => ({
  materialName: '',
  unit: 'cm',
  lengthValue: '',
  widthValue: '',
  heightValue: '',
  quantity: '1',
  notes: '',
})

const isFormValid = (form: MaterialFormData) =>
  form.materialName.trim().length > 0 &&
  parseFloat(form.lengthValue) > 0 &&
  parseFloat(form.widthValue) > 0

const MaterialDialog = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  title = 'Material qo\'shish',
}: MaterialDialogProps) => {
  const [forms, setForms] = useState<MaterialFormData[]>([emptyForm()])

  useEffect(() => {
    if (isOpen) {
      setForms([emptyForm()])
    }
  }, [isOpen])

  const handleSaveAll = async () => {
    const validForms = forms.filter(isFormValid)
    if (validForms.length === 0) return

    for (const form of validForms) {
      await onSave(form)
    }
    setForms([emptyForm()])
  }

  const updateForm = (idx: number, field: keyof MaterialFormData, value: string) => {
    setForms((fs) => fs.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }

  const addForm = () => {
    const firstForm = forms[0]
    const newForm = emptyForm()
    // Auto-fill material name and unit from first row
    if (firstForm) {
      newForm.materialName = firstForm.materialName
      newForm.unit = firstForm.unit
    }
    setForms((fs) => [...fs, newForm])
  }
  const removeForm = (idx: number) => setForms((fs) => fs.filter((_, i) => i !== idx))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
        {forms.map((form, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 12,
              background: 'var(--surface2)',
            }}
          >
            {/* Row header with number and delete button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: 'var(--text3)',
                background: 'var(--border)', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
              }}>
                {idx + 1}
              </span>
              {forms.length > 1 && (
                <button
                  type="button"
                  style={{
                    width: 26, height: 26, border: '1px solid var(--border)',
                    borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text3)',
                  }}
                  onClick={() => removeForm(idx)}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Material name + unit selector row — only in first row */}
            {idx === 0 && (
              <div className={styles.nameRow}>
                <div className={styles.nameField}>
                  <label className={styles.label}>Material nomi *</label>
                  <input
                    className={styles.input}
                    placeholder="LDSP, MDF, DSP, Yog'och..."
                    value={form.materialName}
                    onChange={(e) => updateForm(idx, 'materialName', e.target.value)}
                  />
                </div>
                <div className={styles.unitField}>
                  <label className={styles.label}>O'lchov</label>
                  <select
                    className={styles.select}
                    value={form.unit}
                    onChange={(e) => updateForm(idx, 'unit', e.target.value)}
                  >
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
            )}

            {/* Dimensions row */}
            <div className={styles.dimRow}>
              <div className={styles.dimField}>
                <label className={styles.label}>Bo'yi ({form.unit}) *</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="2400"
                  value={form.lengthValue}
                  onChange={(e) => updateForm(idx, 'lengthValue', e.target.value)}
                />
              </div>
              <div className={styles.dimField}>
                <label className={styles.label}>Eni ({form.unit}) *</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="600"
                  value={form.widthValue}
                  onChange={(e) => updateForm(idx, 'widthValue', e.target.value)}
                />
              </div>
              <div className={styles.dimField}>
                <label className={styles.label}>Balandligi ({form.unit})</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="18"
                  value={form.heightValue}
                  onChange={(e) => updateForm(idx, 'heightValue', e.target.value)}
                />
              </div>
            </div>

            {/* Quantity */}
            <div className={styles.qtyField}>
              <label className={styles.label}>Soni</label>
              <input
                className={styles.input}
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => updateForm(idx, 'quantity', e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className={styles.notesField}>
              <label className={styles.label}>Izoh (ixtiyoriy)</label>
              <input
                className={styles.input}
                placeholder="Qo'shimcha ma'lumot..."
                value={form.notes}
                onChange={(e) => updateForm(idx, 'notes', e.target.value)}
              />
            </div>
          </div>
        ))}

        {/* Add row button */}
        <button
          type="button"
          onClick={addForm}
          style={{
            width: '100%', padding: 10,
            border: '1.5px dashed var(--border)', borderRadius: 8,
            background: 'transparent', color: 'var(--accent)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Yana bir kesim qo'shish
        </button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Bekor qilish
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!forms.some(isFormValid) || isLoading}
          onClick={handleSaveAll}
        >
          {isLoading ? 'Saqlanmoqda...' : `${forms.filter(isFormValid).length} ta kesimni saqlash`}
        </Button>
      </div>
    </Modal>
  )
}

export default MaterialDialog
