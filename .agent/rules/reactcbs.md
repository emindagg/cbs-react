---
trigger: always_on
---

# Feature-Based Architecture

## Structure
```
src/features/[feature-name]/
├── components/  ├── hooks/  ├── services/  
├── utils/  ├── constants/  ├── types.ts  └── index.ts (required)
```

## Rules
1. **Single Responsibility** - Bir dosya = bir görev
2. **Feature Isolation** - Feature'lar birbirini import etmez, global store kullanır
3. **Barrel Exports** - Her feature'da `index.ts` zorunlu

## Limits (Refactoring Triggers)
- Components: >150 lines → extract hooks/logic
- Services: >200 lines → split into multiple services
- Hooks: >120 lines → extract to services
- Utils: >100 lines → categorize
- Constants: >80 lines → group by domain

## AI Instructions
- Generate `index.ts` for every feature
- Warn if file exceeds limits
- Reject cross-feature imports
- Suggest extraction when file grows
- Always use TypeScript (no `any`)

**Priority: Maintainable > Clever**