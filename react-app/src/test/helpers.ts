import { expect } from 'vitest'

/**
 * Assert that two arrays of numbers are close to each other within a precision
 */
export const expectArrayCloseTo = (actual: number[], expected: number[], precision = 2) => {
  expect(actual).toHaveLength(expected.length)
  actual.forEach((val, i) => {
    expect(val).toBeCloseTo(expected[i], precision)
  })
}

/**
 * Assert that a value is a valid MapLibre expression
 */
export const expectValidMapLibreExpression = (expr: unknown) => {
  expect(Array.isArray(expr)).toBe(true)
  if (Array.isArray(expr) && expr.length > 0) {
    expect(typeof expr[0]).toBe('string') // Expression type
  }
}

/**
 * Assert that an array is sorted in ascending order
 */
export const expectSortedAscending = (arr: number[]) => {
  for (let i = 1; i < arr.length; i++) {
    expect(arr[i]).toBeGreaterThanOrEqual(arr[i - 1])
  }
}

/**
 * Assert that a value is within a range
 */
export const expectInRange = (value: number, min: number, max: number) => {
  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

/**
 * Assert that a number is a "nice number" (1, 2, 5, 10, 20, 50, 100, etc.)
 */
export const expectNiceNumber = (value: number) => {
  // Nice numbers are of the form: 1, 2, 5 * 10^n
  const normalized = value / Math.pow(10, Math.floor(Math.log10(value)))
  const niceValues = [1, 2, 5, 10]
  const isNice = niceValues.some(nice => Math.abs(normalized - nice) < 0.01)
  expect(isNice).toBe(true)
}
