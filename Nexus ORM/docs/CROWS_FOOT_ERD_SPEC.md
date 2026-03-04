# Crow's Foot ERD Specification for Prisma

## Rules: Per-End Multiplicity and Optionality

### MULTIPLICITY (ONE vs MANY)
| Field type | End multiplicity |
|------------|------------------|
| `Model[]` or `Model[]?` | MANY (max = *) |
| `Model` or `Model?` | ONE (max = 1) |

### OPTIONALITY (min = 0 vs 1)
| Condition | min |
|-----------|-----|
| `Model?` (nullable relation) | 0 |
| `Int?` (nullable FK) | 0 |
| `Model[]` (list, always 0..*) | 0 |
| `Model` + non-null FK | 1 |
| `@unique` on FK + nullable | 0 |
| `@unique` on FK + required | 1 |

### Symbol Mapping
| (min, max) | Symbol | Description |
|------------|--------|-------------|
| 0..1 | O\| | circle + bar (optional one) |
| 1..1 | \|\| | bar + bar (required one) |
| 0..* | O< | circle + crow (optional many) |
| 1..* | \|< | bar + crow (required many) |

## Both Ends Independent

Each end of the relationship line has its own symbol. Both can have circles.

| Example | Meaning |
|---------|---------|
| Professor O< —— O\| Course | Professor has 0..* Courses, Course has 0..1 Professor |
| Professor O< —— \|\| Course | Professor has 0..* Courses, Course has 1..1 Professor |
| User O\| —— \|\| Profile | User has 0..1 Profile, Profile has 1..1 User |
| Student O< —— O< Course | Both 0..* (many-to-many) |

## Test Fixtures (Expected Crow's Foot Strings)

| Prisma schema | Expected output |
|---------------|-----------------|
| Professor.courses Course[], Course.professor Professor, professorId Int | Professor O< —— \|\| Course |
| Professor.courses Course[], Course.professor Professor?, professorId Int? | Professor O< —— O\| Course |
| User.profile Profile?, profileId Int? @unique; Profile.user User, userId Int | User O\| —— \|\| Profile (or Profile \|\| —— O\| User) |
| Student.courses Course[], Course.students Student[] | Student O< —— O< Course |

## Normalized Relation Type

```ts
interface RelationEnd {
  min: 0 | 1
  max: 1 | 'many'
}

interface NormalizedRelation {
  fromModel: string
  toModel: string
  fromEnd: RelationEnd
  toEnd: RelationEnd
  field: string
  inverseField?: string
  fkField?: string
}
```

## Implementation

See `app/src/utils/erdCardinality.ts`:
- `parseRelations(models)` → `NormalizedRelation[]`
- `endToCrowsFootSymbol(end)` → visual symbol
- `endToMermaidSymbol(end)` → Mermaid ER syntax
- `toCrowsFootString(rel)` → full string for tooltip
