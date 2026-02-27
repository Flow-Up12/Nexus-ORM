// Advanced Components for Admin Panel

// Component: EditRecordModal - Complex modal for editing records
function EditRecordModal({
    record,
    model,
    onSave,
    onCancel,
    isMobile,
    schema,
    isCreating = false,
}) {
    const [formData, setFormData] = React.useState({ ...record })
    const [loading, setLoading] = React.useState(false)

    const handleChange = (key, value) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const handleSubmit = () => {
        setLoading(true)

        // Process data before saving
        const processedData = { ...formData }

        // Convert string values to appropriate types
        model.fields.forEach((field) => {
            const value = processedData[field.name]
            if (value !== undefined && value !== null) {
                if (field.type.includes("Int") && typeof value === "string") {
                    processedData[field.name] = parseInt(value)
                } else if (
                    field.type.includes("Float") &&
                    typeof value === "string"
                ) {
                    processedData[field.name] = parseFloat(value)
                } else if (
                    field.type.includes("Boolean") &&
                    typeof value === "string"
                ) {
                    processedData[field.name] = value.toLowerCase() === "true"
                } else if (field.type.includes("[]") && Array.isArray(value)) {
                    if (field.type.includes("@relation")) {
                        processedData[field.name] = value.map((item) => ({
                            id: item.id,
                        }))
                    }
                } else if (
                    field.type.includes("@relation") &&
                    value &&
                    typeof value === "object"
                ) {
                    processedData[field.name] = { id: value.id }
                }
            }
        })

        try {
            onSave(processedData)
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            setLoading(false)
        }
    }

    const getInputType = (field) => {
        const type = field.type
        const baseType = type.split(" ")[0].replace("[]", "").replace("?", "")
        const modelNames = schema?.parsed?.models?.map((m) => m.name) || []
        const enumNames = schema?.parsed?.enums?.map((e) => e.name) || []

        if (enumNames.includes(baseType)) {
            return type.includes("[]") ? "enumarray" : "enum"
        }

        if (modelNames.includes(baseType) || type.includes("@relation")) {
            return "relation"
        }

        if (type.includes("[]")) return "array"

        const lowerType = type.toLowerCase()
        if (lowerType.includes("int") || lowerType.includes("float"))
            return "number"
        if (lowerType.includes("boolean")) return "checkbox"
        if (lowerType.includes("datetime")) return "datetime-local"
        if (lowerType.includes("json")) return "textarea"
        return "text"
    }

    // Filter out fields that shouldn't be edited directly
    const editableFields = model.fields.filter(
        (field) =>
            !field.type.includes("@id") &&
            !field.type.includes("@updatedAt") &&
            !field.type.includes("@default(now())")
    )

    return React.createElement(
        "div",
        {
            className:
                "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto",
            },
            React.createElement(
                "div",
                { className: "p-4 sm:p-6" },
                React.createElement(
                    "div",
                    { className: "flex items-center justify-between mb-4" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-semibold text-gray-900" },
                        isCreating
                            ? `Create ${model.name}`
                            : `Edit ${model.name}`
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "text-gray-400 hover:text-gray-600 transition-colors",
                        },
                        React.createElement("i", { className: "fas fa-times" })
                    )
                ),

                React.createElement(
                    "div",
                    { className: "space-y-4 mb-6" },
                    ...editableFields.map((field) => {
                        const inputType = getInputType(field)
                        const isRequired = !field.type.includes("?")

                        // Relation field (with autocomplete)
                        if (inputType === "relation") {
                            return React.createElement(RelationField, {
                                key: field.name,
                                field: field,
                                value: formData[field.name],
                                onChange: (value) =>
                                    handleChange(field.name, value),
                                schema: schema,
                            })
                        }

                        // Array field (for string[] and other arrays)
                        if (inputType === "array") {
                            return React.createElement(ArrayField, {
                                key: field.name,
                                field: field,
                                value: formData[field.name],
                                onChange: (value) =>
                                    handleChange(field.name, value),
                            })
                        }

                        // Enum field (with dropdown)
                        if (inputType === "enum") {
                            return React.createElement(EnumField, {
                                key: field.name,
                                field: field,
                                value: formData[field.name],
                                onChange: (value) =>
                                    handleChange(field.name, value),
                                schema: schema,
                            })
                        }

                        // Enum array field (with multi-select)
                        if (inputType === "enumarray") {
                            return React.createElement(EnumArrayField, {
                                key: field.name,
                                field: field,
                                value: formData[field.name],
                                onChange: (value) =>
                                    handleChange(field.name, value),
                                schema: schema,
                            })
                        }

                        // Checkbox field
                        if (inputType === "checkbox") {
                            return React.createElement(
                                "div",
                                { key: field.name },
                                React.createElement(
                                    "label",
                                    { className: "flex items-center" },
                                    React.createElement("input", {
                                        type: "checkbox",
                                        checked: formData[field.name] || false,
                                        onChange: (e) =>
                                            handleChange(
                                                field.name,
                                                e.target.checked
                                            ),
                                        className: "mr-2",
                                    }),
                                    React.createElement(
                                        "span",
                                        {
                                            className:
                                                "text-sm font-medium text-gray-700",
                                        },
                                        field.name,
                                        isRequired &&
                                            isCreating &&
                                            React.createElement(
                                                "span",
                                                { className: "text-red-500" },
                                                " *"
                                            )
                                    )
                                )
                            )
                        }

                        // Textarea field (for JSON)
                        if (inputType === "textarea") {
                            return React.createElement(
                                "div",
                                { key: field.name },
                                React.createElement(
                                    "label",
                                    {
                                        className:
                                            "block text-sm font-medium text-gray-700 mb-1",
                                    },
                                    field.name,
                                    isRequired &&
                                        isCreating &&
                                        React.createElement(
                                            "span",
                                            { className: "text-red-500" },
                                            " *"
                                        ),
                                    field.type.includes("Json") &&
                                        React.createElement(
                                            "span",
                                            {
                                                className:
                                                    "text-xs text-gray-500 ml-1",
                                            },
                                            "(JSON format)"
                                        )
                                ),
                                React.createElement("textarea", {
                                    value: formData[field.name] || "",
                                    onChange: (e) =>
                                        handleChange(
                                            field.name,
                                            e.target.value
                                        ),
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                    rows: "3",
                                    required: isRequired && isCreating,
                                })
                            )
                        }

                        // Default text/number/date input
                        return React.createElement(
                            "div",
                            { key: field.name },
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700 mb-1",
                                },
                                field.name,
                                isRequired &&
                                    isCreating &&
                                    React.createElement(
                                        "span",
                                        { className: "text-red-500" },
                                        " *"
                                    )
                            ),
                            React.createElement("input", {
                                type: inputType,
                                value:
                                    formData[field.name] !== undefined
                                        ? formData[field.name]
                                        : "",
                                onChange: (e) =>
                                    handleChange(field.name, e.target.value),
                                className:
                                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                required: isRequired && isCreating,
                            })
                        )
                    })
                ),

                React.createElement(
                    "div",
                    { className: "flex space-x-3" },
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm",
                        },
                        "Cancel"
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: handleSubmit,
                            disabled: loading,
                            className:
                                "flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50",
                        },
                        loading
                            ? [
                                  React.createElement("i", {
                                      key: "icon",
                                      className: "fas fa-spinner fa-spin mr-2",
                                  }),
                                  isCreating ? "Creating..." : "Saving...",
                              ]
                            : isCreating
                            ? "Create"
                            : "Save Changes"
                    )
                )
            )
        )
    )
}

// Component: RelationField - Autocomplete dropdown for relations
function RelationField({ field, value, onChange, schema }) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [options, setOptions] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [showDropdown, setShowDropdown] = React.useState(false)
    const [selectedItems, setSelectedItems] = React.useState([])

    // Get target model from relation field
    const targetModelName = field.type
        .split(" ")[0]
        .replace("[]", "")
        .replace("?", "")
    const isArray = field.type.includes("[]")
    const relationType = isArray ? "One-to-Many" : "One-to-One"

    // Initialize selected items when value changes
    React.useEffect(() => {
        if (value) {
            if (isArray && Array.isArray(value)) {
                setSelectedItems(value)
            } else if (!isArray && value) {
                setSelectedItems([value])
            }
        } else {
            setSelectedItems([])
        }
    }, [value, isArray])

    // Fetch options when search term changes
    React.useEffect(() => {
        const fetchOptions = async () => {
            if (!searchTerm.trim()) {
                setOptions([])
                return
            }

            setLoading(true)
            try {
                const response = await fetch(
                    `/api/v1/${targetModelName}?q=${encodeURIComponent(
                        searchTerm
                    )}`
                )
                const result = await response.json()

                if (result.data) {
                    setOptions(result.data)
                } else {
                    setOptions([])
                }
            } catch (error) {
                console.error("Error fetching relation options:", error)
                setOptions([])
            } finally {
                setLoading(false)
            }
        }

        if (searchTerm.trim()) {
            const timer = setTimeout(fetchOptions, 300)
            return () => clearTimeout(timer)
        } else {
            setOptions([])
        }
    }, [searchTerm, targetModelName])

    const handleSelect = (option) => {
        let newSelectedItems

        if (isArray) {
            const isAlreadySelected = selectedItems.some(
                (item) => item.id === option.id
            )

            if (isAlreadySelected) {
                newSelectedItems = selectedItems.filter(
                    (item) => item.id !== option.id
                )
            } else {
                newSelectedItems = [...selectedItems, option]
            }
        } else {
            newSelectedItems = [option]
        }

        setSelectedItems(newSelectedItems)
        onChange(isArray ? newSelectedItems : newSelectedItems[0])
        setSearchTerm("")
        setShowDropdown(false)
    }

    const removeItem = (itemId) => {
        const newSelectedItems = selectedItems.filter(
            (item) => item.id !== itemId
        )
        setSelectedItems(newSelectedItems)
        onChange(isArray ? newSelectedItems : newSelectedItems[0] || null)
    }

    const displayValue = (item) => {
        if (!item) return ""

        const displayFields = ["name", "title", "label", "id"]
        for (const field of displayFields) {
            if (item[field]) {
                return item[field]
            }
        }

        return item.id || Object.values(item)[0] || "Unknown"
    }

    return React.createElement(
        "div",
        { className: "relative" },
        React.createElement(
            "label",
            { className: "block text-sm font-medium text-gray-700 mb-1" },
            field.name,
            React.createElement(
                "span",
                {
                    className:
                        "ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full",
                },
                `${relationType} → ${targetModelName}`
            )
        ),

        // Selected Items
        selectedItems.length > 0 &&
            React.createElement(
                "div",
                { className: "flex flex-wrap gap-2 mb-2" },
                ...selectedItems.map((item) =>
                    React.createElement(
                        "div",
                        {
                            key: item.id,
                            className:
                                "bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1 flex items-center",
                        },
                        React.createElement("span", {}, displayValue(item)),
                        React.createElement(
                            "button",
                            {
                                type: "button",
                                onClick: () => removeItem(item.id),
                                className:
                                    "ml-1 text-blue-500 hover:text-blue-700",
                            },
                            React.createElement("i", {
                                className: "fas fa-times",
                            })
                        )
                    )
                )
            ),

        // Search Input
        React.createElement(
            "div",
            { className: "relative" },
            React.createElement("input", {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onFocus: () => setShowDropdown(true),
                placeholder: `Search ${targetModelName}...`,
                className:
                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
            }),
            loading &&
                React.createElement(
                    "div",
                    {
                        className:
                            "absolute right-3 top-1/2 transform -translate-y-1/2",
                    },
                    React.createElement("div", {
                        className:
                            "animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500",
                    })
                )
        ),

        // Dropdown
        showDropdown &&
            React.createElement(
                "div",
                {
                    className:
                        "absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-y-auto",
                },
                options.length === 0
                    ? React.createElement(
                          "div",
                          { className: "p-3 text-sm text-gray-500" },
                          searchTerm.trim()
                              ? "No results found"
                              : "Type to search"
                      )
                    : options.map((option) =>
                          React.createElement(
                              "div",
                              {
                                  key: option.id,
                                  onClick: () => handleSelect(option),
                                  className: `p-3 text-sm hover:bg-gray-100 cursor-pointer ${
                                      selectedItems.some(
                                          (item) => item.id === option.id
                                      )
                                          ? "bg-blue-50"
                                          : ""
                                  }`,
                              },
                              displayValue(option)
                          )
                      )
            )
    )
}

// Component: EnumField - Dropdown for single enum selection
function EnumField({ field, value, onChange, schema }) {
    const enumName = field.type.split(" ")[0].replace("[]", "").replace("?", "")
    const enumDefinition = schema?.parsed?.enums?.find(
        (e) => e.name === enumName
    )

    if (!enumDefinition) {
        return React.createElement(
            "div",
            {},
            React.createElement(
                "label",
                { className: "block text-sm font-medium text-gray-700 mb-1" },
                field.name,
                React.createElement(
                    "span",
                    {
                        className:
                            "ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full",
                    },
                    `Enum ${enumName} not found`
                )
            ),
            React.createElement("input", {
                type: "text",
                value: value || "",
                onChange: (e) => onChange(e.target.value),
                className:
                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
            })
        )
    }

    return React.createElement(
        "div",
        {},
        React.createElement(
            "label",
            { className: "block text-sm font-medium text-gray-700 mb-1" },
            field.name,
            React.createElement(
                "span",
                {
                    className:
                        "ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full",
                },
                enumName
            )
        ),
        React.createElement(
            "select",
            {
                value: value || "",
                onChange: (e) => onChange(e.target.value || null),
                className:
                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
            },
            React.createElement(
                "option",
                { value: "" },
                `Select ${enumName}...`
            ),
            ...enumDefinition.values.map((enumValue) =>
                React.createElement(
                    "option",
                    { key: enumValue, value: enumValue },
                    enumValue
                )
            )
        )
    )
}

// Component: EnumArrayField - Multi-select for enum arrays
function EnumArrayField({ field, value, onChange, schema }) {
    const [selectedValues, setSelectedValues] = React.useState([])

    const enumName = field.type.split(" ")[0].replace("[]", "").replace("?", "")
    const enumDefinition = schema?.parsed?.enums?.find(
        (e) => e.name === enumName
    )

    React.useEffect(() => {
        if (Array.isArray(value)) {
            setSelectedValues(value)
        } else if (value) {
            setSelectedValues([value])
        } else {
            setSelectedValues([])
        }
    }, [value])

    const handleToggle = (enumValue) => {
        const newSelectedValues = selectedValues.includes(enumValue)
            ? selectedValues.filter((v) => v !== enumValue)
            : [...selectedValues, enumValue]

        setSelectedValues(newSelectedValues)
        onChange(newSelectedValues)
    }

    if (!enumDefinition) {
        return React.createElement(
            "div",
            {},
            React.createElement(
                "label",
                { className: "block text-sm font-medium text-gray-700 mb-1" },
                field.name,
                React.createElement(
                    "span",
                    {
                        className:
                            "ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full",
                    },
                    `Enum ${enumName} not found`
                )
            ),
            React.createElement("input", {
                type: "text",
                value: Array.isArray(value) ? value.join(", ") : value || "",
                onChange: (e) =>
                    onChange(
                        e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter((v) => v)
                    ),
                className:
                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                placeholder: "Enter values separated by commas",
            })
        )
    }

    return React.createElement(
        "div",
        {},
        React.createElement(
            "label",
            { className: "block text-sm font-medium text-gray-700 mb-1" },
            field.name,
            React.createElement(
                "span",
                {
                    className:
                        "ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full",
                },
                `${enumName}[]`
            )
        ),

        // Selected Values
        selectedValues.length > 0 &&
            React.createElement(
                "div",
                { className: "flex flex-wrap gap-2 mb-2" },
                ...selectedValues.map((enumValue) =>
                    React.createElement(
                        "div",
                        {
                            key: enumValue,
                            className:
                                "bg-purple-100 text-purple-800 text-xs rounded-full px-2 py-1 flex items-center",
                        },
                        React.createElement("span", {}, enumValue),
                        React.createElement(
                            "button",
                            {
                                type: "button",
                                onClick: () => handleToggle(enumValue),
                                className:
                                    "ml-1 text-purple-500 hover:text-purple-700",
                            },
                            React.createElement("i", {
                                className: "fas fa-times",
                            })
                        )
                    )
                )
            ),

        // Available Options
        React.createElement(
            "div",
            {
                className:
                    "border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto",
            },
            React.createElement(
                "div",
                { className: "space-y-2" },
                ...enumDefinition.values.map((enumValue) =>
                    React.createElement(
                        "label",
                        { key: enumValue, className: "flex items-center" },
                        React.createElement("input", {
                            type: "checkbox",
                            checked: selectedValues.includes(enumValue),
                            onChange: () => handleToggle(enumValue),
                            className: "mr-2",
                        }),
                        React.createElement(
                            "span",
                            { className: "text-sm" },
                            enumValue
                        )
                    )
                )
            )
        )
    )
}

// Component: ArrayField - Handle array inputs like phones, tags, etc.
function ArrayField({ field, value, onChange }) {
    const [items, setItems] = React.useState([])
    const [currentItem, setCurrentItem] = React.useState("")

    React.useEffect(() => {
        if (Array.isArray(value)) {
            setItems(value)
        } else if (value && typeof value === "string") {
            try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                    setItems(parsed)
                } else {
                    setItems([value])
                }
            } catch (e) {
                setItems([value])
            }
        } else if (value === null || value === undefined) {
            setItems([])
        } else {
            setItems([String(value)])
        }
    }, [value])

    const addItem = () => {
        if (currentItem.trim()) {
            const newItems = [...items, currentItem.trim()]
            setItems(newItems)
            onChange(newItems)
            setCurrentItem("")
        }
    }

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
        onChange(newItems)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            addItem()
        } else if (e.key === "," && !e.shiftKey) {
            e.preventDefault()
            addItem()
        }
    }

    const isPhoneArray = field.name.toLowerCase().includes("phone")

    return React.createElement(
        "div",
        {},
        React.createElement(
            "label",
            { className: "block text-sm font-medium text-gray-700 mb-1" },
            field.name,
            React.createElement(
                "span",
                {
                    className:
                        "ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full",
                },
                "Array"
            )
        ),

        // Items List
        items.length > 0 &&
            React.createElement(
                "div",
                { className: "flex flex-wrap gap-2 mb-2" },
                ...items.map((item, index) =>
                    React.createElement(
                        "div",
                        {
                            key: index,
                            className: `${
                                isPhoneArray
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                            } text-xs rounded-full px-2 py-1 flex items-center`,
                        },
                        isPhoneArray &&
                            React.createElement("i", {
                                className: "fas fa-phone-alt mr-1",
                            }),
                        React.createElement("span", {}, item),
                        React.createElement(
                            "button",
                            {
                                type: "button",
                                onClick: () => removeItem(index),
                                className: `ml-1 ${
                                    isPhoneArray
                                        ? "text-blue-500 hover:text-blue-700"
                                        : "text-gray-500 hover:text-gray-700"
                                }`,
                            },
                            React.createElement("i", {
                                className: "fas fa-times",
                            })
                        )
                    )
                )
            ),

        // Input
        React.createElement(
            "div",
            { className: "flex" },
            React.createElement("input", {
                type: isPhoneArray ? "tel" : "text",
                value: currentItem,
                onChange: (e) => setCurrentItem(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: isPhoneArray
                    ? "Enter phone number"
                    : "Type and press Enter or comma to add",
                className:
                    "flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
            }),
            React.createElement(
                "button",
                {
                    type: "button",
                    onClick: addItem,
                    className:
                        "px-3 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600",
                },
                React.createElement("i", { className: "fas fa-plus" })
            )
        ),
        React.createElement(
            "p",
            { className: "mt-1 text-xs text-gray-500" },
            "Press Enter or comma to add an item"
        )
    )
}

// Component: FieldEditModal for editing model fields
function FieldEditModal({ field, onSave, onCancel, isMobile, schema }) {
    const [fieldData, setFieldData] = React.useState({
        name: field.name,
        type: field.type.split(" ")[0],
        optional: field.type.includes("?"),
        unique: field.type.includes("@unique"),
        defaultValue: "",
        isRelation: false,
        relationModel: "",
        isArray: false,
    })

    const fieldTypes = ["String", "Int", "Float", "Boolean", "DateTime", "Json"]

    const modelNames = schema?.parsed?.models?.map((m) => m.name) || []

    React.useEffect(() => {
        const baseType = field.type
            .split(" ")[0]
            .replace("[]", "")
            .replace("?", "")
        const isArray = field.type.includes("[]")
        const isRelation = modelNames.includes(baseType)

        setFieldData({
            name: field.name,
            type: isRelation ? "Relation" : baseType,
            optional: field.type.includes("?"),
            unique: field.type.includes("@unique"),
            defaultValue: "",
            isRelation,
            relationModel: isRelation ? baseType : "",
            isArray,
        })
    }, [field, modelNames])

    const handleSave = () => {
        let typeDefinition

        if (fieldData.isRelation) {
            typeDefinition = fieldData.relationModel
            if (fieldData.isArray) typeDefinition += "[]"
            if (fieldData.optional) typeDefinition += "?"
        } else {
            typeDefinition = fieldData.type
            if (fieldData.isArray) typeDefinition += "[]"
            if (fieldData.optional) typeDefinition += "?"
            if (fieldData.unique) typeDefinition += " @unique"
            if (fieldData.defaultValue)
                typeDefinition += ` @default(${fieldData.defaultValue})`
        }

        onSave({
            name: fieldData.name,
            type: typeDefinition,
        })
    }

    return React.createElement(
        "div",
        {
            className:
                "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto",
            },
            React.createElement(
                "div",
                { className: "p-4 sm:p-6" },
                React.createElement(
                    "div",
                    { className: "flex items-center justify-between mb-4" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-semibold text-gray-900" },
                        "Edit Field"
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "text-gray-400 hover:text-gray-600 transition-colors",
                        },
                        React.createElement("i", { className: "fas fa-times" })
                    )
                ),

                React.createElement(
                    "div",
                    { className: "space-y-4 mb-6" },
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Field Name"
                        ),
                        React.createElement("input", {
                            type: "text",
                            value: fieldData.name,
                            onChange: (e) =>
                                setFieldData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                })),
                            className:
                                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                        })
                    ),

                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Field Type"
                        ),
                        React.createElement(
                            "select",
                            {
                                value: fieldData.type,
                                onChange: (e) => {
                                    const isRelation =
                                        e.target.value === "Relation"
                                    setFieldData((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                        isRelation,
                                        unique: isRelation
                                            ? false
                                            : prev.unique,
                                    }))
                                },
                                className:
                                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                            },
                            React.createElement(
                                "optgroup",
                                { label: "Basic Types" },
                                ...fieldTypes.map((type) =>
                                    React.createElement(
                                        "option",
                                        { key: type, value: type },
                                        type
                                    )
                                )
                            ),
                            modelNames.length > 0 &&
                                React.createElement(
                                    "optgroup",
                                    { label: "Relations" },
                                    React.createElement(
                                        "option",
                                        { value: "Relation" },
                                        "Relation"
                                    )
                                )
                        )
                    ),

                    fieldData.isRelation &&
                        React.createElement(
                            "div",
                            {},
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700 mb-1",
                                },
                                "Related Model"
                            ),
                            React.createElement(
                                "select",
                                {
                                    value: fieldData.relationModel,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            relationModel: e.target.value,
                                        })),
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                },
                                React.createElement(
                                    "option",
                                    { value: "" },
                                    "Select a model..."
                                ),
                                ...modelNames.map((model) =>
                                    React.createElement(
                                        "option",
                                        { key: model, value: model },
                                        model
                                    )
                                )
                            )
                        ),

                    React.createElement(
                        "div",
                        { className: "space-y-3" },
                        React.createElement(
                            "label",
                            { className: "flex items-center" },
                            React.createElement("input", {
                                type: "checkbox",
                                checked: fieldData.isArray,
                                onChange: (e) =>
                                    setFieldData((prev) => ({
                                        ...prev,
                                        isArray: e.target.checked,
                                    })),
                                className: "mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "text-sm text-gray-700" },
                                "Array field ",
                                fieldData.isRelation
                                    ? "(One-to-Many relation)"
                                    : "(Multiple values)"
                            )
                        ),

                        React.createElement(
                            "label",
                            { className: "flex items-center" },
                            React.createElement("input", {
                                type: "checkbox",
                                checked: fieldData.optional,
                                onChange: (e) =>
                                    setFieldData((prev) => ({
                                        ...prev,
                                        optional: e.target.checked,
                                    })),
                                className: "mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "text-sm text-gray-700" },
                                "Optional field"
                            )
                        ),

                        !fieldData.isRelation &&
                            React.createElement(
                                "label",
                                { className: "flex items-center" },
                                React.createElement("input", {
                                    type: "checkbox",
                                    checked: fieldData.unique,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            unique: e.target.checked,
                                        })),
                                    className: "mr-2",
                                }),
                                React.createElement(
                                    "span",
                                    { className: "text-sm text-gray-700" },
                                    "Unique constraint"
                                )
                            ),

                        !fieldData.isRelation &&
                            React.createElement(
                                "div",
                                {},
                                React.createElement(
                                    "label",
                                    {
                                        className:
                                            "block text-sm font-medium text-gray-700 mb-1",
                                    },
                                    "Default Value (optional)"
                                ),
                                React.createElement("input", {
                                    type: "text",
                                    value: fieldData.defaultValue,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            defaultValue: e.target.value,
                                        })),
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                    placeholder: "e.g. 'default', 0, true",
                                })
                            )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "flex space-x-3" },
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm",
                        },
                        "Cancel"
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: handleSave,
                            className:
                                "flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm",
                        },
                        "Save Field"
                    )
                )
            )
        )
    )
}

// Component: AddFieldModal - Enhanced modal for adding new fields
function AddFieldModal({ onSave, onCancel, isMobile, schema }) {
    const [fieldData, setFieldData] = React.useState({
        name: "",
        type: "String",
        optional: false,
        unique: false,
        defaultValue: "",
        isRelation: false,
        relationModel: "",
        isArray: false,
        relationType: "implicit",
        relationName: "",
        isEnum: false,
        foreignKeyName: "",
        foreignKeyUnique: false,
        isOneToOne: false,
        defaultType: "value", // 'value', 'function', 'auto'
        mapTo: "",
        isUpdatedAt: false,
        isId: false,
        idStrategy: "autoincrement", // 'autoincrement', 'uuid', 'cuid'
    })

    const fieldTypes = ["String", "Int", "Float", "Boolean", "DateTime", "Json"]

    // Get available models for relations and enums
    const modelNames = schema?.parsed?.models?.map((m) => m.name) || []
    const enumNames = schema?.parsed?.enums?.map((e) => e.name) || []

    // Auto-generate foreign key name when field name changes for relations
    React.useEffect(() => {
        if (fieldData.isRelation && fieldData.name) {
            const suggestedFkName = `${fieldData.name}Id`
            setFieldData((prev) => ({
                ...prev,
                foreignKeyName: suggestedFkName,
            }))
        }
    }, [fieldData.name, fieldData.isRelation])

    const handleSave = () => {
        if (!fieldData.name.trim()) {
            return
        }

        if (fieldData.isRelation && !fieldData.relationModel) {
            alert("Please select a related model")
            return
        }

        if (fieldData.isRelation && !fieldData.foreignKeyName) {
            alert("Please specify a foreign key field name")
            return
        }

        let typeDefinition

        if (fieldData.isRelation) {
            // Handle relation field with enhanced metadata
            typeDefinition = fieldData.relationModel
            if (fieldData.isArray) typeDefinition += "[]"
            if (fieldData.optional) typeDefinition += "?"

            // Don't add @relation here, let the backend handle it
        } else {
            // Handle regular field
            typeDefinition = fieldData.type
            if (fieldData.isArray) typeDefinition += "[]"
            if (fieldData.optional) typeDefinition += "?"
            if (fieldData.unique) typeDefinition += " @unique"
            if (fieldData.defaultValue)
                typeDefinition += ` @default(${fieldData.defaultValue})`
        }

        onSave({
            name: fieldData.name,
            type: typeDefinition,
            relationMetadata: fieldData.isRelation
                ? {
                      targetModel: fieldData.relationModel,
                      relationType: fieldData.relationType,
                      relationName: fieldData.relationName,
                      isArray: fieldData.isArray,
                      foreignKeyName: fieldData.foreignKeyName,
                      isOneToOne: fieldData.isOneToOne,
                  }
                : null,
        })
    }

    return React.createElement(
        "div",
        {
            className:
                "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
        },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto",
            },
            React.createElement(
                "div",
                { className: "p-4 sm:p-6" },
                React.createElement(
                    "div",
                    { className: "flex items-center justify-between mb-4" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-semibold text-gray-900" },
                        "Add New Field"
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "text-gray-400 hover:text-gray-600 transition-colors",
                        },
                        React.createElement("i", { className: "fas fa-times" })
                    )
                ),

                React.createElement(
                    "div",
                    { className: "space-y-4 mb-6" },
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Field Name *"
                        ),
                        React.createElement("input", {
                            type: "text",
                            value: fieldData.name,
                            onChange: (e) =>
                                setFieldData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                })),
                            className:
                                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                            placeholder: "e.g. firstName",
                        })
                    ),

                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Field Type"
                        ),
                        React.createElement(
                            "select",
                            {
                                value: fieldData.type,
                                onChange: (e) => {
                                    const isRelation =
                                        e.target.value === "Relation"
                                    const isEnum = enumNames.includes(
                                        e.target.value
                                    )
                                    setFieldData((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                        isRelation,
                                        isEnum,
                                        unique:
                                            isRelation || isEnum
                                                ? false
                                                : prev.unique,
                                        relationModel: isRelation
                                            ? prev.relationModel
                                            : "",
                                        relationType: isRelation
                                            ? prev.relationType
                                            : "implicit",
                                        relationName: isRelation
                                            ? prev.relationName
                                            : "",
                                    }))
                                },
                                className:
                                    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                            },
                            React.createElement(
                                "optgroup",
                                { label: "Basic Types" },
                                ...fieldTypes.map((type) =>
                                    React.createElement(
                                        "option",
                                        { key: type, value: type },
                                        type
                                    )
                                )
                            ),
                            enumNames.length > 0 &&
                                React.createElement(
                                    "optgroup",
                                    { label: "Enums" },
                                    ...enumNames.map((enumName) =>
                                        React.createElement(
                                            "option",
                                            { key: enumName, value: enumName },
                                            enumName
                                        )
                                    )
                                ),
                            modelNames.length > 0 &&
                                React.createElement(
                                    "optgroup",
                                    { label: "Relations" },
                                    React.createElement(
                                        "option",
                                        { value: "Relation" },
                                        "Relation"
                                    )
                                )
                        )
                    ),

                    // Enhanced Relation Configuration
                    fieldData.isRelation && [
                        React.createElement(
                            "div",
                            { key: "relation-model" },
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700 mb-1",
                                },
                                "Related Model"
                            ),
                            React.createElement(
                                "select",
                                {
                                    value: fieldData.relationModel,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            relationModel: e.target.value,
                                        })),
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                },
                                React.createElement(
                                    "option",
                                    { value: "" },
                                    "Select a model..."
                                ),
                                ...modelNames.map((model) =>
                                    React.createElement(
                                        "option",
                                        { key: model, value: model },
                                        model
                                    )
                                )
                            )
                        ),

                        // Foreign Key Field Configuration
                        React.createElement(
                            "div",
                            {
                                key: "foreign-key-info",
                                className:
                                    "bg-blue-50 border border-blue-200 rounded-lg p-3",
                            },
                            React.createElement(
                                "h4",
                                {
                                    className:
                                        "text-sm font-semibold text-blue-900 mb-2",
                                },
                                "Foreign Key Configuration"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-xs text-blue-700 mb-3" },
                                "Prisma requires a foreign key field to establish the relationship. This field will store the ID of the related record."
                            ),
                            React.createElement(
                                "div",
                                { className: "space-y-3" },
                                React.createElement(
                                    "div",
                                    {},
                                    React.createElement(
                                        "label",
                                        {
                                            className:
                                                "block text-sm font-medium text-gray-700 mb-1",
                                        },
                                        "Foreign Key Field Name"
                                    ),
                                    React.createElement("input", {
                                        type: "text",
                                        value: fieldData.foreignKeyName,
                                        onChange: (e) =>
                                            setFieldData((prev) => ({
                                                ...prev,
                                                foreignKeyName: e.target.value,
                                            })),
                                        className:
                                            "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                        placeholder:
                                            "e.g. userId, organizationId",
                                    }),
                                    React.createElement(
                                        "p",
                                        {
                                            className:
                                                "mt-1 text-xs text-gray-500",
                                        },
                                        `This will create: ${
                                            fieldData.foreignKeyName
                                        } Int${fieldData.optional ? "?" : ""}${
                                            fieldData.isOneToOne
                                                ? " @unique"
                                                : ""
                                        }`
                                    )
                                ),
                                React.createElement(
                                    "label",
                                    { className: "flex items-center" },
                                    React.createElement("input", {
                                        type: "checkbox",
                                        checked: fieldData.isOneToOne,
                                        onChange: (e) =>
                                            setFieldData((prev) => ({
                                                ...prev,
                                                isOneToOne: e.target.checked,
                                                foreignKeyUnique:
                                                    e.target.checked,
                                            })),
                                        className: "mr-2",
                                    }),
                                    React.createElement(
                                        "span",
                                        { className: "text-sm text-gray-700" },
                                        "One-to-One Relationship ",
                                        React.createElement(
                                            "span",
                                            {
                                                className:
                                                    "text-xs text-gray-500",
                                            },
                                            "(adds @unique to foreign key)"
                                        )
                                    )
                                )
                            )
                        ),

                        // Relationship Type Selection
                        React.createElement(
                            "div",
                            { key: "relation-type" },
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700 mb-2",
                                },
                                "Relationship Type"
                            ),
                            React.createElement(
                                "div",
                                { className: "space-y-2" },
                                React.createElement(
                                    "label",
                                    { className: "inline-flex items-start" },
                                    React.createElement("input", {
                                        type: "radio",
                                        name: "relationType",
                                        value: "implicit",
                                        checked:
                                            fieldData.relationType ===
                                            "implicit",
                                        onChange: (e) =>
                                            setFieldData((prev) => ({
                                                ...prev,
                                                relationType: e.target.value,
                                            })),
                                        className: "mr-2 mt-1",
                                    }),
                                    React.createElement(
                                        "span",
                                        { className: "text-sm" },
                                        React.createElement(
                                            "strong",
                                            {},
                                            "Implicit"
                                        ),
                                        " - Prisma manages the relationship",
                                        React.createElement(
                                            "div",
                                            {
                                                className:
                                                    "text-xs text-gray-500 mt-1",
                                            },
                                            "Prisma automatically creates join tables for many-to-many relationships"
                                        )
                                    )
                                ),
                                React.createElement(
                                    "label",
                                    { className: "inline-flex items-start" },
                                    React.createElement("input", {
                                        type: "radio",
                                        name: "relationType",
                                        value: "explicit",
                                        checked:
                                            fieldData.relationType ===
                                            "explicit",
                                        onChange: (e) =>
                                            setFieldData((prev) => ({
                                                ...prev,
                                                relationType: e.target.value,
                                            })),
                                        className: "mr-2 mt-1",
                                    }),
                                    React.createElement(
                                        "span",
                                        { className: "text-sm" },
                                        React.createElement(
                                            "strong",
                                            {},
                                            "Explicit"
                                        ),
                                        " - Manual join table with custom fields",
                                        React.createElement(
                                            "div",
                                            {
                                                className:
                                                    "text-xs text-gray-500 mt-1",
                                            },
                                            "Create your own join table model with additional fields"
                                        )
                                    )
                                )
                            )
                        ),

                        // Relation Name (for explicit relations)
                        fieldData.relationType === "explicit" &&
                            React.createElement(
                                "div",
                                { key: "relation-name" },
                                React.createElement(
                                    "label",
                                    {
                                        className:
                                            "block text-sm font-medium text-gray-700 mb-1",
                                    },
                                    "Relation Name (optional)"
                                ),
                                React.createElement("input", {
                                    type: "text",
                                    value: fieldData.relationName,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            relationName: e.target.value,
                                        })),
                                    placeholder: "e.g. UserPostRelation",
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                }),
                                React.createElement(
                                    "p",
                                    { className: "mt-1 text-xs text-gray-500" },
                                    "Custom name for the relationship. If not provided, Prisma will auto-generate one."
                                )
                            ),

                        // Schema Preview
                        fieldData.relationModel &&
                            fieldData.foreignKeyName &&
                            React.createElement(
                                "div",
                                {
                                    key: "schema-preview",
                                    className:
                                        "bg-gray-100 border border-gray-300 rounded-lg p-3 mt-4",
                                },
                                React.createElement(
                                    "h4",
                                    {
                                        className:
                                            "text-sm font-semibold text-gray-900 mb-2",
                                    },
                                    "Schema Preview"
                                ),
                                React.createElement(
                                    "pre",
                                    {
                                        className:
                                            "text-xs font-mono text-gray-700 whitespace-pre",
                                    },
                                    `// Fields that will be added:\n${
                                        fieldData.foreignKeyName
                                    } Int${fieldData.optional ? "?" : ""}${
                                        fieldData.isOneToOne ? " @unique" : ""
                                    }\n${fieldData.name} ${
                                        fieldData.relationModel
                                    }${
                                        fieldData.optional ? "?" : ""
                                    } @relation(fields: [${
                                        fieldData.foreignKeyName
                                    }], references: [id]${
                                        fieldData.relationName
                                            ? `, name: "${fieldData.relationName}"`
                                            : ""
                                    })`
                                )
                            ),
                    ],

                    React.createElement(
                        "div",
                        { className: "space-y-3" },
                        React.createElement(
                            "label",
                            { className: "flex items-center" },
                            React.createElement("input", {
                                type: "checkbox",
                                checked: fieldData.isArray,
                                onChange: (e) =>
                                    setFieldData((prev) => ({
                                        ...prev,
                                        isArray: e.target.checked,
                                    })),
                                className: "mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "text-sm text-gray-700" },
                                "Array field ",
                                fieldData.isRelation
                                    ? "(One-to-Many relation)"
                                    : "(Multiple values)"
                            )
                        ),

                        React.createElement(
                            "label",
                            { className: "flex items-center" },
                            React.createElement("input", {
                                type: "checkbox",
                                checked: fieldData.optional,
                                onChange: (e) =>
                                    setFieldData((prev) => ({
                                        ...prev,
                                        optional: e.target.checked,
                                    })),
                                className: "mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "text-sm text-gray-700" },
                                "Optional field"
                            )
                        ),

                        !fieldData.isRelation &&
                            React.createElement(
                                "label",
                                { className: "flex items-center" },
                                React.createElement("input", {
                                    type: "checkbox",
                                    checked: fieldData.unique,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            unique: e.target.checked,
                                        })),
                                    className: "mr-2",
                                }),
                                React.createElement(
                                    "span",
                                    { className: "text-sm text-gray-700" },
                                    "Unique constraint"
                                )
                            ),

                        !fieldData.isRelation &&
                            React.createElement(
                                "div",
                                {},
                                React.createElement(
                                    "label",
                                    {
                                        className:
                                            "block text-sm font-medium text-gray-700 mb-1",
                                    },
                                    "Default Value (optional)"
                                ),
                                React.createElement("input", {
                                    type: "text",
                                    value: fieldData.defaultValue,
                                    onChange: (e) =>
                                        setFieldData((prev) => ({
                                            ...prev,
                                            defaultValue: e.target.value,
                                        })),
                                    className:
                                        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                    placeholder: "e.g. 'default', 0, true",
                                })
                            )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "flex space-x-3" },
                    React.createElement(
                        "button",
                        {
                            onClick: onCancel,
                            className:
                                "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm",
                        },
                        "Cancel"
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: handleSave,
                            disabled:
                                !fieldData.name.trim() ||
                                (fieldData.isRelation &&
                                    !fieldData.relationModel),
                            className:
                                "flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50",
                        },
                        "Add Field"
                    )
                )
            )
        )
    )
}

// Export advanced components
if (typeof window !== "undefined") {
    window.AdvancedComponents = {
        EditRecordModal,
        RelationField,
        EnumField,
        EnumArrayField,
        ArrayField,
        FieldEditModal,
        AddFieldModal,
    }
}
