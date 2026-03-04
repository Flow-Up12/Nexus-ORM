export interface ParsedField {
  name: string
  type: string
  raw?: string
}

export interface ParsedModel {
  name: string
  fields: ParsedField[]
  attributes?: string[]
}

export interface ParsedEnum {
  name: string
  values: string[]
}

export interface SchemaData {
  raw: string
  parsed: {
    models: ParsedModel[]
    enums: ParsedEnum[]
  }
}

export interface Relationship {
  from: string
  to: string
  field: string
  type: string
  isArray: boolean
  isOptional: boolean
  /** Whether the inverse relation (on the "to" model) is optional. E.g. Student.university University? */
  isOptionalOnTo?: boolean
}
