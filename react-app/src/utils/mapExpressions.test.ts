import { describe, it, expect } from 'vitest'

import { expectValidMapLibreExpression } from '@/test/helpers'

import { buildStepExpression, buildInterpolateExpression } from './mapExpressions'

describe('mapExpressions', () => {
  describe('buildStepExpression', () => {
    it('should build valid step expression', () => {
      const property = 'dataValue'
      const breaks = [0, 10, 20, 30, 40]
      const colors = ['#fff', '#ccc', '#999', '#666']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expectValidMapLibreExpression(expr)
      expect(expr[0]).toBe('step')
    })

    it('should have correct structure', () => {
      const property = 'value'
      const breaks = [0, 10, 20]
      const colors = ['#fff', '#000']
      const defaultColor = '#ccc'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr[0]).toBe('step')
      expect(expr[1]).toEqual(['get', 'value'])
      expect(expr[2]).toBe('#ccc') // default color
    })

    it('should include all breaks and colors', () => {
      const property = 'dataValue'
      const breaks = [0, 10, 20, 30]
      const colors = ['#fff', '#ccc', '#999']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      // Format: ['step', ['get', prop], default, break0, color0, break1, color1, ...]
      expect(expr).toContain(0)
      expect(expr).toContain(10)
      expect(expr).toContain(20)
      expect(expr).toContain('#fff')
      expect(expr).toContain('#ccc')
      expect(expr).toContain('#999')
    })

    it('should handle single break', () => {
      const property = 'value'
      const breaks = [0]
      const colors: string[] = []
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr[0]).toBe('step')
      expect(expr[2]).toBe('#000')
    })

    it('should handle two breaks', () => {
      const property = 'value'
      const breaks = [0, 10]
      const colors = ['#fff']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr).toContain(0)
      expect(expr).toContain('#fff')
    })

    it('should handle many breaks', () => {
      const property = 'value'
      const breaks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
      const colors = ['#fff', '#eee', '#ddd', '#ccc', '#bbb', '#aaa', '#999', '#888', '#777', '#666']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr[0]).toBe('step')
      expect(expr.length).toBeGreaterThan(10)
    })

    it('should use last color if colors array is shorter', () => {
      const property = 'value'
      const breaks = [0, 10, 20, 30]
      const colors = ['#fff', '#000'] // Only 2 colors for 3 breaks
      const defaultColor = '#ccc'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      // Should fallback to last color
      expect(expr).toContain('#000')
    })

    it('should handle negative breaks', () => {
      const property = 'value'
      const breaks = [-100, -50, 0, 50, 100]
      const colors = ['#f00', '#ff0', '#0f0', '#0ff']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr).toContain(-100)
      expect(expr).toContain(-50)
      expect(expr).toContain(0)
    })

    it('should handle fractional breaks', () => {
      const property = 'value'
      const breaks = [0.1, 0.5, 1.0, 1.5]
      const colors = ['#fff', '#ccc', '#999']
      const defaultColor = '#000'

      const expr = buildStepExpression(property, breaks, colors, defaultColor)

      expect(expr).toContain(0.1)
      expect(expr).toContain(0.5)
      expect(expr).toContain(1.0)
    })

    it('should handle different property names', () => {
      const properties = ['value', 'dataValue', 'population', 'density']

      properties.forEach(property => {
        const expr = buildStepExpression(property, [0, 10], ['#fff'], '#000')
        expect(expr[1]).toEqual(['get', property])
      })
    })

    it('should handle hex colors', () => {
      const expr = buildStepExpression('value', [0, 10], ['#ffffff'], '#000000')

      expect(expr).toContain('#ffffff')
      expect(expr).toContain('#000000')
    })

    it('should handle rgb colors', () => {
      const expr = buildStepExpression('value', [0, 10], ['rgb(255,255,255)'], 'rgb(0,0,0)')

      expect(expr).toContain('rgb(255,255,255)')
      expect(expr).toContain('rgb(0,0,0)')
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

      // Format: ['interpolate', ['linear'], ['get', prop], stop0, color0, stop1, color1, ...]
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
      expect(expr.length).toBeGreaterThan(20) // 3 base + 10 stops × 2
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
      // Step expression for classed choropleth
      const stepExpr = buildStepExpression(
        'dataValue',
        [0, 10, 20, 30, 40],
        ['#fff', '#ccc', '#999', '#666'],
        '#000',
      )

      // Interpolate expression for continuous choropleth
      const interpExpr = buildInterpolateExpression('dataValue', [
        [0, '#fff'],
        [50, '#888'],
        [100, '#000'],
      ])

      expectValidMapLibreExpression(stepExpr)
      expectValidMapLibreExpression(interpExpr)
      expect(stepExpr[0]).toBe('step')
      expect(interpExpr[0]).toBe('interpolate')
    })

    it('should handle same property name', () => {
      const property = 'population'
      const stepExpr = buildStepExpression(property, [0, 1000], ['#fff'], '#000')
      const interpExpr = buildInterpolateExpression(property, [[0, '#fff'], [1000, '#000']])

      expect(stepExpr[1]).toEqual(['get', property])
      expect(interpExpr[2]).toEqual(['get', property])
    })
  })
})
