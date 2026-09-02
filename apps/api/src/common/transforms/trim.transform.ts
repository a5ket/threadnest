import { Transform } from 'class-transformer'

/** DTO property decorator: trims a string field during validation. Non-string values pass through unchanged. */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const Trim = () => Transform(({ value }) => typeof value === 'string' ? value.trim() : value)