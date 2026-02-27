import { Select } from './Select'

const SCALAR_TYPES = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal']

interface FieldTypeSelectProps {
  value: string
  onChange: (value: string) => void
  modelNames: string[]
  enumNames: string[]
  label?: string
  disabled?: boolean
}

export function FieldTypeSelect({
  value,
  onChange,
  modelNames,
  enumNames,
  label = 'Field Type',
  disabled,
}: FieldTypeSelectProps) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      <optgroup label="Basic Types">
        {SCALAR_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </optgroup>
      {enumNames.length > 0 && (
        <optgroup label="Enums">
          {enumNames.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </optgroup>
      )}
      {modelNames.length > 0 && (
        <optgroup label="Relations">
          <option value="Relation">Relation</option>
        </optgroup>
      )}
    </Select>
  )
}
