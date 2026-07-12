import { Transform } from 'class-transformer'

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const Lowercase = () => Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)