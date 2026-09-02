import { Transform } from 'class-transformer'

/**
 * DTO property decorator: lowercases a string field during validation (e.g. for emails).
 * Non-string values pass through unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
export const Lowercase = () => Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)