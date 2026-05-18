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

const MaterialDialog = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  title = 'Material qo\'shish',
}: MaterialDialogProps) => {
  const [form, setForm] = useState<MaterialFormData>({
    materialName: '',
    unit: 'cm',
    lengthValue: '',
    widthValue: '',
    heightValue: '',
    quantity: '1',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      setForm({
        materialName: '',
        unit: 'cm',
        lengthValue: '',
        widthValue: '',
        heightValue: '',
        quantity: '1',
        notes: '',
      })
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!form.materialName.trim() || !form.lengthValue || !form.widthValue) {
      return
    }
    await onSave(form)
  }

  const isValid =
    form.materialName.trim().length > 0 &&
    parseFloat(form.lengthValue) > 0 &&
    parseFloat(form.widthValue) > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.form}>
        {/* Material name + unit selector row */}
        <div className={styles.nameRow}>
          <div className={styles.nameField}>
            <label className={styles.label}>Material nomi *</label>
            <input
              className={styles.input}
              placeholder="LDSP, MDF, DSP, Yog'och..."
              value={form.materialName}
              onChange={(e) => setForm((f) => ({ ...f, materialName: e.target.value }))}
            />
          </div>
          <div className={styles.unitField}>
            <label className={styles.label}>O'lchov</label>
            <select
              className={styles.select}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as MaterialUnit }))}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        {/* Dimensions row */}
        <div className={styles.dimRow}>
          <div className={styles.dimField}>
            <label className={styles.label}>Bo'yi ({form.unit}) *</label>
            <input
              className={styles.input}
              type="number"
              placeholder="2400"
              value={form.lengthValue}
              onChange={(e) => setForm((f) => ({ ...f, lengthValue: e.target.value }))}
            />
          </div>
          <div className={styles.dimField}>
            <label className={styles.label}>Eni ({form.unit}) *</label>
            <input
              className={styles.input}
              type="number"
              placeholder="600"
              value={form.widthValue}
              onChange={(e) => setForm((f) => ({ ...f, widthValue: e.target.value }))}
            />
          </div>
          <div className={styles.dimField}>
            <label className={styles.label}>Balandligi ({form.unit})</label>
            <input
              className={styles.input}
              type="number"
              placeholder="18"
              value={form.heightValue}
              onChange={(e) => setForm((f) => ({ ...f, heightValue: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </div>

        {/* Notes */}
        <div className={styles.notesField}>
          <label className={styles.label}>Izoh (ixtiyoriy)</label>
          <input
            className={styles.input}
            placeholder="Qo'shimcha ma'lumot..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="primary" disabled={!isValid || isLoading} onClick={handleSave}>
            {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default MaterialDialog
