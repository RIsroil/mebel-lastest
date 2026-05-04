import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTopbar } from '@/context/TopbarContext'
import { adminApi } from '@/api/admin.api'
import { workshopApi } from '@/api/workshop.api'
import type { AdminUserResponse } from '@/types/admin.types'
import type { UserRole, PayType } from '@/types/auth.types'
import { formatNumber } from '@/utils/formatMoney'
import { formatDate } from '@/utils/formatDate'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import styles from './UsersPage.module.css'

const ROLE_LABELS: Record<UserRole, string> = { OWNER: 'Owner', WORKER: 'Worker', ADMIN: 'Admin' }
const PAY_LABELS:  Record<PayType, string>  = { DAILY: 'Kunlik', MONTHLY: 'Oylik' }

const createSchema = z.object({
  username:         z.string().min(3, 'Kamida 3 ta belgi'),
  password:         z.string().min(4, 'Kamida 4 ta belgi'),
  fullName:         z.string().optional(),
  phone:            z.string().optional(),
  role:             z.enum(['OWNER','WORKER','ADMIN']),
  workshopId:       z.string().optional(),
  payType:          z.enum(['DAILY','MONTHLY']).optional(),
  dailyHoursTarget: z.coerce.number().min(0).optional(),
  dailySalary:      z.coerce.number().min(0).optional(),
  commissionPct:    z.coerce.number().min(0).max(100).optional(),
})
type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  fullName:         z.string().optional(),
  phone:            z.string().optional(),
  role:             z.enum(['OWNER','WORKER','ADMIN']).optional(),
  workshopId:       z.string().optional(),
  payType:          z.enum(['DAILY','MONTHLY']).optional(),
  dailyHoursTarget: z.coerce.number().min(0).optional(),
  dailySalary:      z.coerce.number().min(0).optional(),
  commissionPct:    z.coerce.number().min(0).max(100).optional(),
  newPassword:      z.string().optional(),
})
type EditForm = z.infer<typeof editSchema>

const blockSchema = z.object({
  reason:    z.string().min(4, 'Sabab kiritish shart'),
  blockDays: z.coerce.number().min(0).optional(),
})
type BlockForm = z.infer<typeof blockSchema>

const PAGE_SIZE = 20

const UsersPage = () => {
  const { setTitle, setActions } = useTopbar()
  const queryClient = useQueryClient()

  // Filters
  const [roleFilter, setRoleFilter]       = useState<UserRole | ''>('')
  const [workshopFilter, setWorkshopFilter] = useState('')
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(0)

  // Modal state
  const [showCreate, setShowCreate]       = useState(false)
  const [editUser, setEditUser]           = useState<AdminUserResponse | null>(null)
  const [deleteUser, setDeleteUser]       = useState<AdminUserResponse | null>(null)
  const [blockUser, setBlockUser]         = useState<AdminUserResponse | null>(null)

  const usersKey = ['adminUsers', roleFilter, workshopFilter, page]
  const { data: usersResp, isLoading } = useQuery({
    queryKey: usersKey,
    queryFn: () => adminApi.users.getAll({
      role:       roleFilter || undefined,
      workshopId: workshopFilter || undefined,
      page,
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
    }),
  })

  const { data: workshopsResp } = useQuery({
    queryKey: ['workshops'],
    queryFn:  () => workshopApi.getAll({ size: 100 }),
  })

  const createMut = useMutation({
    mutationFn: adminApi.users.create,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: usersKey }); closeCreate() },
  })
  const editMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: EditForm }) => adminApi.users.update(id, body),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: usersKey }); closeEdit() },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.users.remove(id),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: usersKey }); setDeleteUser(null) },
  })
  const blockMut = useMutation({
    mutationFn: ({ id, reason, blockDays }: { id: string; reason: string; blockDays?: number }) =>
      adminApi.users.block(id, { reason, blockDays }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: usersKey }); setBlockUser(null) },
  })
  const unblockMut = useMutation({
    mutationFn: (id: string) => adminApi.users.unblock(id),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: usersKey }),
  })

  const createForm = useForm<CreateForm>({
    resolver:      zodResolver(createSchema) as Resolver<CreateForm>,
    defaultValues: { role: 'WORKER' },
  })
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema) as Resolver<EditForm>,
  })
  const blockForm = useForm<BlockForm>({
    resolver: zodResolver(blockSchema) as Resolver<BlockForm>,
  })

  // Rol o'zgarganda form fields ko'rinishi uchun watch
  const createRole = useWatch({ control: createForm.control, name: 'role' })
  const editRole   = useWatch({ control: editForm.control,   name: 'role' })

  useEffect(() => {
    setTitle('Foydalanuvchilar')
    setActions(
      <Button size="sm" onClick={() => setShowCreate(true)}>+ Yangi user</Button>
    )
    return () => { setTitle(''); setActions(null) }
  }, [setTitle, setActions])

  const closeCreate = () => { setShowCreate(false); createForm.reset({ role: 'WORKER' }) }
  const closeEdit   = () => { setEditUser(null); editForm.reset() }

  const openEdit = (u: AdminUserResponse) => {
    setEditUser(u)
    editForm.reset({
      fullName:         u.fullName ?? '',
      phone:            u.phone ?? '',
      role:             u.role,
      workshopId:       u.workshopId ?? '',
      payType:          u.payType ?? undefined,
      dailyHoursTarget: u.dailyHoursTarget ?? 0,
      dailySalary:      u.dailySalary ?? 0,
      commissionPct:    u.commissionPct ?? 0,
    })
  }

  const onCreateSubmit = (data: CreateForm) => {
    createMut.mutate({
      username:         data.username,
      password:         data.password,
      fullName:         data.fullName || undefined,
      phone:            data.phone || undefined,
      role:             data.role,
      workshopId:       data.workshopId || undefined,
      payType:          data.payType,
      dailyHoursTarget: data.dailyHoursTarget || undefined,
      dailySalary:      data.dailySalary || undefined,
      commissionPct:    data.commissionPct || undefined,
    })
  }

  const onEditSubmit = (data: EditForm) => {
    if (!editUser) return
    editMut.mutate({
      id: editUser.id,
      body: {
        fullName:         data.fullName || undefined,
        phone:            data.phone || undefined,
        role:             data.role,
        workshopId:       data.workshopId || undefined,
        payType:          data.payType,
        dailyHoursTarget: data.dailyHoursTarget || undefined,
        dailySalary:      data.dailySalary || undefined,
        commissionPct:    data.commissionPct || undefined,
        newPassword:      data.newPassword || undefined,
      },
    })
  }

  const onBlockSubmit = (data: BlockForm) => {
    if (!blockUser) return
    blockMut.mutate({ id: blockUser.id, reason: data.reason, blockDays: data.blockDays || undefined })
  }

  const users     = usersResp?.data?.content ?? []
  const totalPages = usersResp?.data?.totalPages ?? 1
  const workshops = workshopsResp?.data?.content ?? []

  // Client-side search filter
  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      (u.fullName ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q)
    )
  })

  const isWorkerRole = (role?: string) => role === 'WORKER' || role === 'OWNER'

  return (
    <div>
      {/* Filters */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="🔍 Ism, username, telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(0) }}
        >
          <option value="">Barcha rollar</option>
          <option value="OWNER">Owner</option>
          <option value="WORKER">Worker</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className={styles.filterSelect}
          value={workshopFilter}
          onChange={(e) => { setWorkshopFilter(e.target.value); setPage(0) }}
        >
          <option value="">Barcha sehlar</option>
          {workshops.map((ws) => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>
        <span className={styles.hint}>
          Jami: <strong>{usersResp?.data?.totalElements ?? 0}</strong> ta
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Username</th>
              <th>Rol</th>
              <th>Seh</th>
              <th>To'lov</th>
              <th>Maosh/kun</th>
              <th>Holat</th>
              <th>Qo'shilgan</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className={styles.userCell}>
                    <Avatar name={u.fullName || u.username} role={u.role} size="sm" />
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.fullName || u.username}</span>
                      {u.phone && <span className={styles.userPhone}>{u.phone}</span>}
                    </div>
                  </div>
                </td>
                <td className={styles.username}>{u.username}</td>
                <td>
                  <span className={cn(styles.roleBadge, styles[`role${u.role}`])}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td>{u.workshopName ?? '—'}</td>
                <td>
                  {u.payType
                    ? <span className={cn(styles.payBadge, u.payType === 'DAILY' ? styles.payDaily : styles.payMonthly)}>
                        {PAY_LABELS[u.payType]}
                      </span>
                    : '—'}
                </td>
                <td className={styles.salary}>
                  {u.dailySalary != null ? formatNumber(u.dailySalary) : '—'}
                </td>
                <td>
                  {u.blocked
                    ? <Badge variant="BLOCKED" />
                    : u.active
                      ? <Badge variant="ACTIVE" />
                      : <span className={styles.inactiveBadge}>Nofaol</span>}
                </td>
                <td className={styles.dateCell}>{formatDate(u.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.actionBtn} onClick={() => openEdit(u)}>
                      Tahrir
                    </button>
                    {u.blocked ? (
                      <button
                        type="button"
                        className={cn(styles.actionBtn, styles.unblockBtn)}
                        disabled={unblockMut.isPending}
                        onClick={() => unblockMut.mutate(u.id)}
                      >
                        Ochish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={cn(styles.actionBtn, styles.blockBtn)}
                        onClick={() => { setBlockUser(u); blockForm.reset() }}
                      >
                        Blok
                      </button>
                    )}
                    <button
                      type="button"
                      className={cn(styles.actionBtn, styles.deleteBtn)}
                      onClick={() => setDeleteUser(u)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={cn(styles.pageBtn, page === i && styles.pageBtnActive)}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={closeCreate} title="Yangi foydalanuvchi">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} noValidate>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Username *</label>
              <input className={styles.formInput} placeholder="ali_xasanov" {...createForm.register('username')} />
              {createForm.formState.errors.username && (
                <span className={styles.errText}>{createForm.formState.errors.username.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Parol *</label>
              <input className={styles.formInput} type="password" placeholder="••••••" {...createForm.register('password')} />
              {createForm.formState.errors.password && (
                <span className={styles.errText}>{createForm.formState.errors.password.message}</span>
              )}
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To'liq ism</label>
              <input className={styles.formInput} placeholder="Ali Xasanov" {...createForm.register('fullName')} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Telefon</label>
              <input className={styles.formInput} placeholder="+998901234567" {...createForm.register('phone')} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Rol *</label>
              <select className={styles.formSelect} {...createForm.register('role')}>
                <option value="WORKER">Worker</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {isWorkerRole(createRole) && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Seh</label>
                <select className={styles.formSelect} {...createForm.register('workshopId')}>
                  <option value="">— Seh —</option>
                  {workshops.map((ws) => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {isWorkerRole(createRole) && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>To'lov turi</label>
                  <select className={styles.formSelect} {...createForm.register('payType')}>
                    <option value="">—</option>
                    <option value="DAILY">Kunlik</option>
                    <option value="MONTHLY">Oylik</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kunlik soat maqsadi</label>
                  <input className={styles.formInput} type="number" placeholder="8" {...createForm.register('dailyHoursTarget')} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kunlik maosh (UZS)</label>
                  <input className={styles.formInput} type="number" placeholder="50000" {...createForm.register('dailySalary')} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Komissiya %</label>
                  <input className={styles.formInput} type="number" placeholder="5" {...createForm.register('commissionPct')} />
                </div>
              </div>
            </>
          )}
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" size="sm" onClick={closeCreate}>Bekor qilish</Button>
            <Button type="submit" size="sm" loading={createMut.isPending}>Yaratish →</Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={editUser !== null} onClose={closeEdit} title="Tahrirlash">
        {editUser && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} noValidate>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>To'liq ism</label>
                <input className={styles.formInput} {...editForm.register('fullName')} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Telefon</label>
                <input className={styles.formInput} {...editForm.register('phone')} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rol</label>
                <select className={styles.formSelect} {...editForm.register('role')}>
                  <option value="WORKER">Worker</option>
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {isWorkerRole(editRole) && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Seh</label>
                  <select className={styles.formSelect} {...editForm.register('workshopId')}>
                    <option value="">— Seh —</option>
                    {workshops.map((ws) => (
                      <option key={ws.id} value={ws.id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {isWorkerRole(editRole) && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>To'lov turi</label>
                  <select className={styles.formSelect} {...editForm.register('payType')}>
                    <option value="">—</option>
                    <option value="DAILY">Kunlik</option>
                    <option value="MONTHLY">Oylik</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kunlik maosh</label>
                  <input className={styles.formInput} type="number" {...editForm.register('dailySalary')} />
                </div>
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Yangi parol (o'zgartirish kerak bo'lsa)</label>
              <input className={styles.formInput} type="password" placeholder="••••••" {...editForm.register('newPassword')} />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" size="sm" onClick={closeEdit}>Bekor qilish</Button>
              <Button type="submit" size="sm" loading={editMut.isPending}>Saqlash →</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Block modal */}
      <Modal isOpen={blockUser !== null} onClose={() => setBlockUser(null)} title="Foydalanuvchini bloklash">
        {blockUser && (
          <form onSubmit={blockForm.handleSubmit(onBlockSubmit)} noValidate>
            <p className={styles.confirmText}>
              <strong>{blockUser.fullName || blockUser.username}</strong> ni bloklaysizmi?
            </p>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Sabab *</label>
              <input className={styles.formInput} placeholder="Qoidabuzarlik..." {...blockForm.register('reason')} />
              {blockForm.formState.errors.reason && (
                <span className={styles.errText}>{blockForm.formState.errors.reason.message}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bloklash muddati (kun, bo'sh = doimiy)</label>
              <input className={styles.formInput} type="number" placeholder="7" {...blockForm.register('blockDays')} />
            </div>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setBlockUser(null)}>Bekor qilish</Button>
              <Button type="submit" variant="danger" size="sm" loading={blockMut.isPending}>Bloklash</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={deleteUser !== null} onClose={() => setDeleteUser(null)} title="O'chirishni tasdiqlash">
        {deleteUser && (
          <div>
            <p className={styles.confirmText}>
              <strong>{deleteUser.fullName || deleteUser.username}</strong> ni o'chirasizmi? Bu amal qaytarib bo'lmaydi.
            </p>
            <div className={styles.formActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteUser(null)}>Bekor qilish</Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleteUser.id)}
              >
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UsersPage
