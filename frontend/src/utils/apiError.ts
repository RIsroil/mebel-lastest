import axios from 'axios'

// Backend qaytaradigan xato kodlari → O'zbekcha matnlar
const ERROR_MAP: Record<string, string> = {
  'user.not.found':                   "Foydalanuvchi topilmadi",
  'invalid.credentials':              "Noto'g'ri username yoki parol",
  'username.already.exists':          "Bu username allaqachon band",
  'access.denied':                    "Ruxsat yo'q",
  'account.blocked':                  "Hisob vaqtincha bloklangan",
  'invalid.or.expired.refresh.token': "Sessiya muddati tugagan, qayta kiring",
  'already.checked.in.today':         "Bugun allaqachon kirish belgilangan",
  'hours.submission.deadline.passed': "Soat kiritish muhlati o'tib ketdi",
  'hours.already.locked':             "Soatlar allaqachon qulflangan",
  'attendance.not.found.today':       "Bugungi davomat topilmadi",
  'insufficient.stock':               "Omborxonada yetarli material yo'q",
  'earning.already.paid':             "Bu daromad allaqachon to'langan",
  'workshop.not.found':               "Seh topilmadi",
  'worker.not.found':                 "Ishchi topilmadi",
  'worker.deleted.successfully':      "Ishchi o'chirildi",
  'owner.has.no.workshop':            "Ownerga seh biriktirilmagan",
}

export const getApiError = (error: unknown): string => {
  if (!axios.isAxiosError(error)) return "Tarmoq xatosi. Internet aloqasini tekshiring"

  const code: string | undefined = error.response?.data?.message
  if (code && ERROR_MAP[code]) return ERROR_MAP[code]

  switch (error.response?.status) {
    case 400: return "Noto'g'ri ma'lumotlar kiritildi"
    case 401: return "Avtorizatsiya talab qilinadi"
    case 403: return "Ruxsat yo'q"
    case 404: return "Ma'lumot topilmadi"
    case 409: return "Bunday ma'lumot allaqachon mavjud"
    case 500: return "Server xatosi. Qayta urinib ko'ring"
    default:  return code ?? "Xatolik yuz berdi"
  }
}

/** Hisob bloklangan xatosini aniqlash */
export const isBlockedError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false
  const msg: string | undefined = error.response?.data?.message
  return !!(msg?.toLowerCase().includes('block') || error.response?.status === 423)
}
