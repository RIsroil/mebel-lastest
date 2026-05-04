/** className birlashtiruvchi yordamchi — falsy qiymatlarni o'tkazib yuboradi */
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ')
