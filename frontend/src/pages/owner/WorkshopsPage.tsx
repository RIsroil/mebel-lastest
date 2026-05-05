import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { workshopApi } from '@/api/workshop.api'
import type { WorkshopResponse } from '@/types/workshop.types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import styles from './WorkshopsPage.module.css'

const schema = z.object({
  name:        z.string().min(2, 'Kamida 2 ta belgi'),
  address:     z.string().optional(),
  phone:       z.string().optional(),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const WorkshopsPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit]     = useState(false)

  const { data: resp, isLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn:  () => workshopApi.getAll({ size: 1 }),
  })

  // Backend: ApiResponse<PageResponse<WorkshopResponse>>
  const workshop: WorkshopResponse | undefined = resp?.data?.data?.content?.[0]

  const createMut = useMutation({
    mutationFn: workshopApi.create,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] })
      closeCreate()
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: FormData }) =>
      workshopApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] })
      setShowEdit(false)
    },
  })

  const createForm = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const editForm = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  useEffect(() => {
    setTitle('Korxona')
    if (!workshop && !isLoading) {
      setActions(<Button size="sm" onClick={() => setShowCreate(true)}>+ Korxona qo'shish</Button>)
    } else {
      setActions(null)
    }
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions, workshop, isLoading])

  const closeCreate = () => { setShowCreate(false); createForm.reset() }

  const openEdit = () => {
    if (!workshop) return
    editForm.reset({
      name:        workshop.name,
      address:     workshop.address ?? '',
      phone:       workshop.phone ?? '',
      description: workshop.description ?? '',
    })
    setShowEdit(true)
  }

  const onCreateSubmit = (data: FormData) => createMut.mutate(data)
  const onEditSubmit   = (data: FormData) => {
    if (!workshop) return
    updateMut.mutate({ id: workshop.id, body: data })
  }

  if (isLoading) {
    return <div className={styles.loading}>Yuklanmoqda...</div>
  }

  if (!workshop) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏭</div>
        <div className={styles.emptyTitle}>Korxona mavjud emas</div>
        <div className={styles.emptyDesc}>Hali korxona qo'shilmagan. Yangi korxona yarating.</div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Korxona qo'shish</Button>

        <Modal isOpen={showCreate} onClose={closeCreate} title="Yangi korxona qo'shish">
          <WorkshopForm
            form={createForm}
            onSubmit={onCreateSubmit}
            onCancel={closeCreate}
            isPending={createMut.isPending}
            submitLabel="Qo'shish →"
          />
        </Modal>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>🏭</div>
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.workshopName}>{workshop.name}</h2>
            <span className={cn(styles.statusBadge, workshop.active ? styles.active : styles.inactive)}>
              {workshop.active ? 'Aktiv' : 'Nofaol'}
            </span>
          </div>
          <Button size="sm" onClick={openEdit}>Tahrirlash</Button>
        </div>

        <div className={styles.divider} />

        {/* Details */}
        <div className={styles.detailGrid}>
          <DetailRow icon="📍" label="Manzil"   value={workshop.address} />
          <DetailRow icon="📞" label="Telefon"  value={workshop.phone} />
          <DetailRow icon="📝" label="Tavsif"   value={workshop.description} />
          <DetailRow icon="📅" label="Yaratilgan" value={formatDate(workshop.createdAt)} />
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Korxonani tahrirlash">
        <WorkshopForm
          form={editForm}
          onSubmit={onEditSubmit}
          onCancel={() => setShowEdit(false)}
          isPending={updateMut.isPending}
          submitLabel="Saqlash →"
        />
      </Modal>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface DetailRowProps {
  icon:   string
  label:  string
  value?: string | null
  mono?:  boolean
}

const DetailRow = ({ icon, label, value, mono }: DetailRowProps) => (
  <div className={styles.detailRow}>
    <span className={styles.detailIcon}>{icon}</span>
    <div className={styles.detailContent}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={cn(styles.detailValue, mono && styles.monoValue)}>
        {value || '—'}
      </span>
    </div>
  </div>
)

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ── WorkshopForm ─────────────────────────────────────────────────────────────

interface WorkshopFormProps {
  form:        ReturnType<typeof useForm<FormData>>
  onSubmit:    (data: FormData) => void
  onCancel:    () => void
  isPending:   boolean
  submitLabel: string
}

const WorkshopForm = ({ form, onSubmit, onCancel, isPending, submitLabel }: WorkshopFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Nomi *</label>
        <input className={styles.formInput} placeholder="1-sex" {...register('name')} />
        {errors.name && <span className={styles.errText}>{errors.name.message}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Manzil</label>
        <input className={styles.formInput} placeholder="Toshkent, Chilonzor" {...register('address')} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Telefon</label>
        <input className={styles.formInput} placeholder="+998901234567" {...register('phone')} />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tavsif</label>
        <textarea
          className={cn(styles.formInput, styles.textarea)}
          rows={3}
          placeholder="Qo'shimcha ma'lumot..."
          {...register('description')}
        />
      </div>

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" size="sm" loading={isSubmitting || isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default WorkshopsPage
