import { describe, it, expect } from 'vitest'

import { expectValidMapLibreExpression } from '@/test/helpers'

import { buildStepExpression, buildInterpolateExpression } from './mapExpressions'

describe('mapExpressions', () => {
  describe('buildStepExpression', () => {
    it('should build valid case expression', () => {
      const property = 'dataValue'
      const breaks = [0, 10, 20, 30, 40]
      const colors = ['#fff', '#ccc', '#999', '#666']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expectValidMapLibreExpression(expr)
      expect(expr[0]).toBe('case')
    })

    it('should have correct structure', () => {
      const property = 'value'
      const breaks = [0, 10, 20]
      const colors = ['#fff', '#000']
      const defaultColor = '#ccc'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr[0]).toBe('case')
      // First branch: value < breaks[0] → defaultColor
      expect(expr[1]).toEqual(['<', ['get', 'value'], 0])
      expect(expr[2]).toBe('#ccc')
    })

    it('should include all breaks and colors', () => {
      const property = 'dataValue'
      const breaks = [0, 10, 20, 30]
      const colors = ['#fff', '#ccc', '#999']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      const flat = JSON.stringify(expr)
      expect(flat).toContain('"#fff"')
      expect(flat).toContain('"#ccc"')
      expect(flat).toContain('"#999"')
      expect(flat).toContain('0')
      expect(flat).toContain('10')
      expect(flat).toContain('20')
      expect(flat).toContain('30')
    })

    it('should handle empty breaks', () => {
      const expr = buildStepExpression('value', [], [], '#000')
      expect(expr[0]).toBe('case')
    })

    it('should handle single break', () => {
      const expr = buildStepExpression('value', [0], [], '#000')
      expect(expr[0]).toBe('case')
      // All features with a value get defaultColor (no classes defined)
      expect(expr[3]).toBe('#000')
    })

    it('should handle two breaks', () => {
      const expr = buildStepExpression('value', [0, 10], ['#fff'], '#000')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('"#fff"')
    })

    it('should handle many breaks', () => {
      const property = 'value'
      const breaks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const colors = ['#fff', '#eee', '#ddd', '#ccc', '#bbb', '#aaa', '#999', '#888', '#777', '#666']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr[0]).toBe('case')
      // case: 1 (op) + 1 (below-min cond) + 1 (defaultColor) + 10 classes × 2 + 1 fallback = 24
      expect(expr.length).toBe(24)
    })

    it('should use last color if colors array is shorter', () => {
      const expr = buildStepExpression('value', [0, 10, 20, 30], ['#fff', '#000'], '#ccc')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('"#000"')
    })

    it('should handle negative breaks', () => {
      const expr = buildStepExpression('value', [-100, -50, 0, 50, 100], ['#f00', '#ff0', '#0f0', '#0ff'], '#000')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('-100')
      expect(flat).toContain('-50')
    })

    it('should handle fractional breaks', () => {
      const expr = buildStepExpression('value', [0.1, 0.5, 1.0, 1.5], ['#fff', '#ccc', '#999'], '#000')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('0.1')
      expect(flat).toContain('0.5')
    })

    it('should handle different property names', () => {
      const properties = ['value', 'dataValue', 'population', 'density']

      properties.forEach((property) => {
        const expr = buildStepExpression(property, [0, 10], ['#fff'], '#000')
        // First condition references the property
        expect(expr[1]).toEqual(['<', ['get', property], 0])
      })
    })

    it('should handle hex colors', () => {
      const expr = buildStepExpression('value', [0, 10], ['#ffffff'], '#000000')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('"#ffffff"')
      expect(flat).toContain('"#000000"')
    })

    it('should handle rgb colors', () => {
      const expr = buildStepExpression('value', [0, 10], ['rgb(255,255,255)'], 'rgb(0,0,0)')
      const flat = JSON.stringify(expr)
      expect(flat).toContain('rgb(255,255,255)')
      expect(flat).toContain('rgb(0,0,0)')
    })

    describe('GIS-convention boundary semantics', () => {
      // Evaluate a case expression against a numeric value (mirrors MapLibre runtime)
      function evaluate(expr: unknown[], value: number): string {
        // expr = ['case', cond1, out1, cond2, out2, ..., fallback]
        for (let i = 1; i < expr.length - 1; i += 2) {
          const cond = expr[i] as [string, ['get', string], number]
          const [op, , threshold] = cond
          if (op === '<' && value < threshold) return expr[i + 1] as string
          if (op === '<=' && value <= threshold) return expr[i + 1] as string
          if (op === '!=' && value !== null) return expr[i + 1] as string
        }
        return expr[expr.length - 1] as string
      }

      it('value below min returns defaultColor', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 5)).toBe('#def')
      })

      it('value at min (== breaks[0]) lands in first class', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 10)).toBe('#a')
      })

      it('value strictly inside first class falls in first class', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 15)).toBe('#a')
      })

      it('value exactly on interior break lands in LOWER class (matches legend)', () => {
        // Regression test for bug #5: map and legend agreement at boundaries.
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 20)).toBe('#a')
      })

      it('value just above interior break lands in next class', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 20.0001)).toBe('#b')
      })

      it('value at max (== last break) lands in last class', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 30)).toBe('#b')
      })

      it('value above max falls to fallback color (same as last class)', () => {
        const expr = buildStepExpression('v', [10, 20, 30], ['#a', '#b'], '#def')
        expect(evaluate(expr, 40)).toBe('#b')
      })

      it('handles negative breaks with consistent semantics', () => {
        const expr = buildStepExpression('v', [-100, -50, 0], ['#a', '#b'], '#def')
        expect(evaluate(expr, -101)).toBe('#def')
        expect(evaluate(expr, -100)).toBe('#a')
        expect(evaluate(expr, -50)).toBe('#a')
        expect(evaluate(expr, -49.9)).toBe('#b')
        expect(evaluate(expr, 0)).toBe('#b')
      })
    })
  })

  describe('buildInterpolateExpression', () => {
    it('should build valid interpolate expression', () => {
      const property = 'dataValue'
      const colorStops: [number, string][] = [
        [0, '#fff'],
        [50, '#888'],
        [100, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expectValidMapLibreExpression(expr)
      expect(expr[0]).toBe('interpolate')
    })

    it('should have correct structure', () => {
      const property = 'value'
      const colorStops: [number, string][] = [
        [0, '#fff'],
        [100, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr[0]).toBe('interpolate')
      expect(expr[1]).toEqual(['linear'])
      expect(expr[2]).toEqual(['get', 'value'])
    })

    it('should include all color stops', () => {
      const property = 'dataValue'
      const colorStops: [number, string][] = [
        [0, '#fff'],
        [25, '#ccc'],
        [50, '#999'],
        [75, '#666'],
        [100, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr).toContain(0)
      expect(expr).toContain(25)
      expect(expr).toContain(50)
      expect(expr).toContain(75)
      expect(expr).toContain(100)
      expect(expr).toContain('#fff')
      expect(expr).toContain('#ccc')
      expect(expr).toContain('#999')
      expect(expr).toContain('#666')
      expect(expr).toContain('#000')
    })

    it('should handle two stops', () => {
      const property = 'value'
      const colorStops: [number, string][] = [
        [0, '#fff'],
        [100, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr).toContain(0)
      expect(expr).toContain(100)
      expect(expr).toContain('#fff')
      expect(expr).toContain('#000')
    })

    it('should handle many stops', () => {
      const property = 'value'
      const colorStops: [number, string][] = Array.from({ length: 10 }, (_, i) => [
        i * 10,
        `#${i}${i}${i}`,
      ])

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr[0]).toBe('interpolate')
      expect(expr.length).toBeGreaterThan(20)
    })

    it('should handle negative stops', () => {
      const property = 'value'
      const colorStops: [number, string][] = [
        [-100, '#f00'],
        [0, '#fff'],
        [100, '#00f'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr).toContain(-100)
      expect(expr).toContain(0)
      expect(expr).toContain(100)
    })

    it('should handle fractional stops', () => {
      const property = 'value'
      const colorStops: [number, string][] = [
        [0.0, '#fff'],
        [0.5, '#888'],
        [1.0, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      expect(expr).toContain(0.0)
      expect(expr).toContain(0.5)
      expect(expr).toContain(1.0)
    })

    it('should handle different property names', () => {
      const properties = ['value', 'dataValue', 'population', 'density']

      properties.forEach(property => {
        const expr = buildInterpolateExpression(property, [[0, '#fff'], [100, '#000']])
        expect(expr[2]).toEqual(['get', property])
      })
    })

    it('should handle hex colors', () => {
      const expr = buildInterpolateExpression('value', [
        [0, '#ffffff'],
        [100, '#000000'],
      ])

      expect(expr).toContain('#ffffff')
      expect(expr).toContain('#000000')
    })

    it('should handle rgb colors', () => {
      const expr = buildInterpolateExpression('value', [
        [0, 'rgb(255,255,255)'],
        [100, 'rgb(0,0,0)'],
      ])

      expect(expr).toContain('rgb(255,255,255)')
      expect(expr).toContain('rgb(0,0,0)')
    })

    it('should handle rgba colors', () => {
      const expr = buildInterpolateExpression('value', [
        [0, 'rgba(255,255,255,1)'],
        [100, 'rgba(0,0,0,0.5)'],
      ])

      expect(expr).toContain('rgba(255,255,255,1)')
      expect(expr).toContain('rgba(0,0,0,0.5)')
    })

    it('should maintain stop order', () => {
      const property = 'value'
      const colorStops: [number, string][] = [
        [0, '#fff'],
        [50, '#888'],
        [100, '#000'],
      ]

      const expr = buildInterpolateExpression(property, colorStops)

      const stop0Index = expr.indexOf(0)
      const stop50Index = expr.indexOf(50)
      const stop100Index = expr.indexOf(100)

      expect(stop0Index).toBeLessThan(stop50Index)
      expect(stop50Index).toBeLessThan(stop100Index)
    })
  })

  describe('integration', () => {
    it('should work together for different visualization types', () => {
      const stepExpr = buildStepExpression(
        'dataValue',
        [0, 10, 20, 30, 40],
        ['#fff', '#ccc', '#999', '#666'],
        '#000',
      )

      const interpExpr = buildInterpolateExpression('dataValue', [
        [0, '#fff'],
        [50, '#888'],
        [100, '#000'],
      ])

      expectValidMapLibreExpression(stepExpr)
      expectValidMapLibreExpression(interpExpr)
      expect(stepExpr[0]).toBe('case')
      expect(interpExpr[0]).toBe('interpolate')
    })

    it('should handle same property name', () => {
      const property = 'population'
      const stepExpr = buildStepExpression(property, [0, 1000], ['#fff'], '#000')
      const interpExpr = buildInterpolateExpression(property, [[0, '#fff'], [1000, '#000']])

      expect(stepExpr[1]).toEqual(['<', ['get', property], 0])
      expect(interpExpr[2]).toEqual(['get', property])
    })
  })
})
