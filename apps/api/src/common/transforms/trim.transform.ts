import { Transform } from 'class-transformer'

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const Trim = () => Transform(({ value }) => typeof value === 'string' ? value.trim() : value)