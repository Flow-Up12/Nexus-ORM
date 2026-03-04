/**
 * Crow's Foot notation for Prisma ERD
 *
 * RULES (per-end multiplicity and optionality):
 *
 * MULTIPLICITY (ONE vs MANY):
 * - Field type Model[] or Model[]? → MANY (that end)
 * - Field type Model or Model? → ONE (that end)
 *
 * OPTIONALITY (min = 0 vs 1):
 * - Field type Model? or Int? (nullable FK) → OPTIONAL (min=0)
 * - Field type Model[] (list) → OPTIONAL (min=0, list can be empty)
 * - Field type Model (required) + non-null FK → REQUIRED (min=1)
 *
 * SYMBOL MAPPING:
 * | 0..1 | O|  | circle + bar   |
 * | 1..1 | ||  | bar + bar      |
 * | 0..* | O<  | circle + crow  |
 * | 1..* | |<  | bar + crow     |
 *
 * BOTH ENDS INDEPENDENT:
 * - Professor O< —— O| Course: Professor has 0..* Courses, Course has 0..1 Professor
 * - Professor O< —— || Course: Professor has 0..* Courses, Course has 1..1 Professor
 * - User O| —— || Profile: User has 0..1 Profile, Profile has 1..1 User
 * - Student O< —— O< Course: both 0..* (many-to-many)
 */

import type { ParsedModel, ParsedField } from '@/types/schema'

export type Multiplicity = 1 | 'many'
export type MinCard = 0 | 1
export type MaxCard = 1 | 'many'

export interface RelationEnd {
  min: MinCard
  max: MaxCard
}

export interface NormalizedRelation {
  fromModel: string
  toModel: string
  fromEnd: RelationEnd
  toEnd: RelationEnd
  field: string
  inverseField?: string
  fkField?: string
  relationName?: string
  /** Model that has the FK (child side); for m:n may be undefined */
  fkModel?: string
  /** Model that has the referenced PK (parent side) */
  pkModel?: string
  /** FK field name for line anchoring */
  fkFieldName?: string
  /** Referenced PK field name for line anchoring */
  pkFieldName?: string
}

function isModelReference(field: ParsedField, modelNames: string[]): boolean {
  const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '')
  return modelNames.includes(baseType)
}

function getRelatedModelName(field: ParsedField): string {
  return field.type.split(' ')[0].replace('[]', '').replace('?', '')
}

function getFkFieldForRelation(model: ParsedModel, relationFieldName: string): ParsedField | undefined {
  const fkName = relationFieldName + 'Id'
  return model.fields?.find((f) => f.name === fkName)
}

/** Parse @relation(fields: [x], references: [y]) from type string */
function parseRelationFields(type: string): { fkField: string; pkField: string } | null {
  const fieldsMatch = type.match(/fields:\s*\[([^\]]+)\]/)
  const refsMatch = type.match(/references:\s*\[([^\]]+)\]/)
  if (!fieldsMatch || !refsMatch) return null
  const fkField = fieldsMatch[1].split(',')[0].trim()
  const pkField = refsMatch[1].split(',')[0].trim()
  return fkField && pkField ? { fkField, pkField } : null
}

function hasUniqueConstraint(field: ParsedField): boolean {
  return field.type.includes('@unique')
}

/** Compute (min, max) for a relation field on a model */
function computeEndFromField(field: ParsedField, model: ParsedModel): RelationEnd {
  const isArray = field.type.includes('[]')
  const isOptional = field.type.includes('?')

  if (isArray) {
    return { min: 0, max: 'many' }
  }

  const fkField = getFkFieldForRelation(model, field.name)
  const fkNullable = fkField?.type.includes('?') ?? false
  const isUnique = fkField ? hasUniqueConstraint(fkField) : false

  if (isUnique) {
    return isOptional || fkNullable ? { min: 0, max: 1 } : { min: 1, max: 1 }
  }

  return isOptional || fkNullable ? { min: 0, max: 1 } : { min: 1, max: 1 }
}

/** Map RelationEnd to Crow's Foot symbol string (visual: O|, ||, O<, |<) */
export function endToCrowsFootSymbol(end: RelationEnd): string {
  if (end.max === 'many') {
    return end.min === 0 ? 'O<' : '|<'
  }
  return end.min === 0 ? 'O|' : '||'
}

/** Map RelationEnd to Mermaid ER diagram symbol (o|, ||, o{, |{) */
export function endToMermaidSymbol(end: RelationEnd): string {
  if (end.max === 'many') {
    return end.min === 0 ? 'o{' : '|{'
  }
  return end.min === 0 ? 'o|' : '||'
}

/** Full Crow's Foot string for a relation: "FromSymbol —— ToSymbol" */
export function toCrowsFootString(rel: NormalizedRelation): string {
  const fromSym = endToCrowsFootSymbol(rel.fromEnd)
  const toSym = endToCrowsFootSymbol(rel.toEnd)
  return `${rel.fromModel} ${fromSym} —— ${toSym} ${rel.toModel}`
}

/**
 * Parse Prisma models and produce normalized relations with accurate per-end cardinality.
 * Deduplicates by model pair (one relation per pair).
 */
export function parseRelations(models: ParsedModel[]): NormalizedRelation[] {
  const modelNames = models.map((m) => m.name)
  const modelMap = new Map(models.map((m) => [m.name, m]))
  const seenPairs = new Set<string>()

  const result: NormalizedRelation[] = []

  models.forEach((model) => {
    model.fields?.forEach((field) => {
      if (!field.type.includes('@relation') && !isModelReference(field, modelNames)) return

      const targetModel = getRelatedModelName(field)
      if (!targetModel || !modelNames.includes(targetModel)) return

      const pairKey = [model.name, targetModel].sort().join('|')
      if (seenPairs.has(pairKey)) return
      seenPairs.add(pairKey)

      const targetModelObj = modelMap.get(targetModel)
      const inverseField = targetModelObj?.fields?.find(
        (f) =>
          getRelatedModelName(f) === model.name &&
          (f.type.includes('@relation') || isModelReference(f, modelNames))
      )

      const fromEnd = computeEndFromField(field, model)
      const toEnd: RelationEnd = inverseField
        ? computeEndFromField(inverseField, targetModelObj!)
        : { min: 0, max: 1 }

      const fkField = getFkFieldForRelation(model, field.name)
      const inverseFk = inverseField ? getFkFieldForRelation(targetModelObj!, inverseField.name) : undefined

      let fkModel: string | undefined
      let pkModel: string | undefined
      let fkFieldName: string | undefined
      let pkFieldName: string | undefined

      const parsedFrom = parseRelationFields(field.type)
      const parsedInverse = inverseField ? parseRelationFields(inverseField.type) : null

      if (parsedFrom) {
        fkModel = model.name
        pkModel = targetModel
        fkFieldName = parsedFrom.fkField
        pkFieldName = parsedFrom.pkField
      } else if (parsedInverse) {
        fkModel = targetModel
        pkModel = model.name
        fkFieldName = parsedInverse.fkField
        pkFieldName = parsedInverse.pkField
      } else {
        fkFieldName = fkField?.name ?? inverseFk?.name
        pkFieldName = 'id'
        if (fkField) {
          fkModel = model.name
          pkModel = targetModel
        } else if (inverseFk) {
          fkModel = targetModel
          pkModel = model.name
        }
      }

      result.push({
        fromModel: model.name,
        toModel: targetModel,
        fromEnd,
        toEnd,
        field: field.name,
        inverseField: inverseField?.name,
        fkField: fkField?.name ?? inverseFk?.name,
        fkModel,
        pkModel,
        fkFieldName,
        pkFieldName,
      })
    })
  })

  return result
}
