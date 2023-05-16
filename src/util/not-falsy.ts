export const notFalsy = <T>(value: T): value is Exclude<T, 0 | false | undefined | null | ''> => Boolean(value)
