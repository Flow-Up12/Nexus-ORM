// Content Components for Admin Panel

// Component: Header
function Header({
    selectedItem,
    setSidebarOpen,
    isMobile,
    schema,
    showNotification,
}) {
    const getItemDetails = () => {
        if (selectedItem.type === "model") {
            const model = schema?.parsed?.models?.find(
                (m) => m.name === selectedItem.name
            )
            return {
                icon: "fa-table",
                color: "text-blue-500",
                bgColor: "bg-blue-50",
                count: model?.fields?.length || 0,
                label: "fields",
            }
        } else {
            const enumItem = schema?.parsed?.enums?.find(
                (e) => e.name === selectedItem.name
            )
            return {
                icon: "fa-list",
                color: "text-purple-500",
                bgColor: "bg-purple-50",
                count: enumItem?.values?.length || 0,
                label: "values",
            }
        }
    }

    const handleDelete = async () => {
        const itemType = selectedItem.type
        const itemName = selectedItem.name

        if (
            !confirm(
                `Are you sure you want to delete the ${itemType} "${itemName}"? This action cannot be undone.`
            )
        ) {
            return
        }

        try {
            let apiUrl = ""
            if (itemType === "model") {
                apiUrl = `/ufo-studio/api/schema/model/${itemName}`
            } else if (itemType === "enum") {
                apiUrl = `/ufo-studio/api/schema/enum/${itemName}`
            }

            const response = await fetch(apiUrl, {
                method: "DELETE",
                headers: getAuthHeaders(),
            })

            const result = await response.json()
            if (result.success) {
                showNotification(`${itemType} deleted successfully`)
                window.location.reload()
            } else {
                throw new Error(
                    result.message || `Failed to delete ${itemType}`
                )
            }
        } catch (error) {
            showNotification(
                `Failed to delete ${itemType}: ${error.message}`,
                "error"
            )
        }
    }

    const details = getItemDetails()

    return React.createElement(
        "div",
        {
            className: "bg-white border-b border-gray-200 px-4 sm:px-6 py-4",
            key: `header-${selectedItem.type}-${selectedItem.name}`,
        },
        React.createElement(
            "div",
            { className: "flex items-center justify-between" },
            React.createElement(
                "div",
                { className: "flex items-center min-w-0 flex-1" },
                isMobile &&
                    React.createElement(
                        "button",
                        {
                            onClick: () => setSidebarOpen(true),
                            className:
                                "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-3 transition-colors",
                        },
                        React.createElement("i", { className: "fas fa-bars" })
                    ),

                React.createElement(
                    "div",
                    {
                        className: `w-10 h-10 ${details.bgColor} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`,
                    },
                    React.createElement("i", {
                        className: `fas ${details.icon} ${details.color}`,
                    })
                ),

                React.createElement(
                    "div",
                    { className: "min-w-0 flex-1" },
                    React.createElement(
                        "div",
                        { className: "flex items-center" },
                        React.createElement(
                            "h1",
                            {
                                className:
                                    "text-xl font-semibold text-gray-900 truncate",
                            },
                            selectedItem.name
                        ),
                        React.createElement(
                            "span",
                            {
                                className:
                                    "ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium uppercase",
                            },
                            selectedItem.type
                        )
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        `${details.count} ${details.label}`
                    )
                )
            ),

            React.createElement(
                "div",
                { className: "flex items-center space-x-2 flex-shrink-0" },
                selectedItem.type === "model" &&
                    React.createElement(CreateRecordButton, {
                        modelName: selectedItem.name,
                        schema: schema,
                        showNotification: showNotification,
                        compact: isMobile,
                    }),

                (selectedItem.type === "model" ||
                    selectedItem.type === "enum") &&
                    React.createElement(
                        "button",
                        {
                            onClick: handleDelete,
                            className:
                                "inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm",
                        },
                        React.createElement("i", {
                            className: "fas fa-trash mr-1 sm:mr-2",
                        }),
                        !isMobile && React.createElement("span", {}, "Delete")
                    )
            )
        )
    )
}

// Component: TabNavigation
function TabNavigation({ selectedItem, activeTab, setActiveTab, isMobile }) {
    const getTabs = () => {
        if (selectedItem.type === "model") {
            return [
                { id: "structure", label: "Structure", icon: "fa-table" },
                { id: "data", label: "Data", icon: "fa-database" },
                {
                    id: "relationships",
                    label: "Relations",
                    icon: "fa-project-diagram",
                },
                { id: "diagram", label: "ER Diagram", icon: "fa-sitemap" },
            ]
        } else if (selectedItem.type === "enum") {
            return [{ id: "values", label: "Values", icon: "fa-list" }]
        } else if (selectedItem.type === "schema") {
            return [
                { id: "editor", label: "Schema Editor", icon: "fa-code" },
                { id: "migrations", label: "Migrations", icon: "fa-cogs" },
                {
                    id: "overview",
                    label: "Schema Overview",
                    icon: "fa-sitemap",
                },
            ]
        } else if (selectedItem.type === "create-model") {
            return [{ id: "form", label: "Create Model", icon: "fa-table" }]
        } else if (selectedItem.type === "create-enum") {
            return [{ id: "form", label: "Create Enum", icon: "fa-list" }]
        } else {
            return [{ id: "form", label: "Create", icon: "fa-plus" }]
        }
    }

    const tabs = getTabs()

    return React.createElement(
        "div",
        {
            className: "bg-white border-b border-gray-200",
            key: `tabs-${selectedItem.type}-${selectedItem.name}`,
        },
        React.createElement(
            "div",
            { className: "px-4 sm:px-6" },
            React.createElement(
                "nav",
                { className: "flex space-x-6 sm:space-x-8 overflow-x-auto" },
                ...tabs.map((tab) =>
                    React.createElement(
                        "button",
                        {
                            key: tab.id,
                            onClick: () => setActiveTab(tab.id),
                            className: `flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`,
                        },
                        React.createElement("i", {
                            className: `fas ${tab.icon} mr-1 sm:mr-2 text-xs`,
                        }),
                        React.createElement(
                            "span",
                            { className: isMobile ? "text-xs" : "" },
                            tab.label
                        )
                    )
                )
            )
        )
    )
}

// NOTE: ContentRenderer moved to app.js to avoid duplication and ensure proper prop passing

// Component: ModelStructure
function ModelStructure({
    model,
    showNotification,
    onSchemaUpdate,
    isMobile,
    schema,
}) {
    const [editMode, setEditMode] = React.useState(false)
    const [fields, setFields] = React.useState(model.fields)
    const [editingField, setEditingField] = React.useState(null)
    const [showAddField, setShowAddField] = React.useState(false)

    const renderFieldBadge = (field) => {
        const fieldType = getFieldType(field, schema)
        const relationInfo =
            fieldType === "relation" ? getRelationInfo(field) : null

        if (fieldType === "relation") {
            return React.createElement(
                "div",
                { className: "flex items-center space-x-2" },
                React.createElement(
                    "span",
                    { className: "field-badge field-relation" },
                    "RELATION"
                ),
                React.createElement(
                    "span",
                    {
                        className:
                            "text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded",
                    },
                    `→ ${relationInfo.targetModel}`
                )
            )
        }

        return React.createElement(
            "span",
            {
                className: `field-badge field-${fieldType.replace("-", "")}`,
            },
            fieldType.toUpperCase().replace("-", " ")
        )
    }

    const getRelationInfo = (field) => {
        const type = field.type
        const isArray = type.includes("[]")
        let targetModel = type.split(" ")[0].replace("[]", "").replace("?", "")
        const isExplicitRelation = type.includes("@relation")

        let relationType = "One-to-One"
        if (isArray && !isExplicitRelation) {
            relationType = "One-to-Many"
        } else if (isExplicitRelation) {
            relationType = isArray ? "Many-to-Many" : "Many-to-One"
        } else if (isArray) {
            relationType = "One-to-Many"
        }

        return {
            targetModel,
            isArray,
            isExplicitRelation,
            relationType,
            isForeignKey: isExplicitRelation && !isArray,
        }
    }

    const handleSaveField = async (fieldData) => {
        try {
            const response = await fetch("/ufo-studio/api/schema/field", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    modelName: model.name,
                    oldFieldName: editingField.name,
                    newField: fieldData,
                }),
            })

            const result = await response.json()

            if (result.success) {
                showNotification("Field updated successfully")
                setEditingField(null)
                if (onSchemaUpdate) onSchemaUpdate()
            } else {
                throw new Error(result.message || "Failed to update field")
            }
        } catch (error) {
            showNotification(
                "Failed to update field: " + error.message,
                "error"
            )
        }
    }

    const handleDeleteField = async (fieldName) => {
        if (
            confirm(`Are you sure you want to delete the field "${fieldName}"?`)
        ) {
            try {
                const response = await fetch("/ufo-studio/api/schema/field", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        modelName: model.name,
                        fieldName: fieldName,
                    }),
                })

                const result = await response.json()

                if (result.success) {
                    showNotification("Field deleted successfully")
                    setFields((prev) =>
                        prev.filter((f) => f.name !== fieldName)
                    )
                    if (onSchemaUpdate) onSchemaUpdate()
                } else {
                    throw new Error(result.message || "Failed to delete field")
                }
            } catch (error) {
                showNotification(
                    "Failed to delete field: " + error.message,
                    "error"
                )
            }
        }
    }

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full flex flex-col" },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full",
            },
            // Header
            React.createElement(
                "div",
                {
                    className:
                        "px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between",
                },
                React.createElement(
                    "div",
                    {},
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Table Structure"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        `${fields.length} columns`
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex items-center space-x-2" },
                    editMode
                        ? [
                              React.createElement(
                                  "button",
                                  {
                                      key: "cancel",
                                      onClick: () => setEditMode(false),
                                      className:
                                          "px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm",
                                  },
                                  React.createElement("i", {
                                      className: "fas fa-times mr-1",
                                  }),
                                  "Cancel"
                              ),
                              React.createElement(
                                  "button",
                                  {
                                      key: "save",
                                      onClick: () => {
                                          setEditMode(false)
                                          showNotification(
                                              "Changes saved successfully"
                                          )
                                      },
                                      className:
                                          "px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm",
                                  },
                                  React.createElement("i", {
                                      className: "fas fa-check mr-1",
                                  }),
                                  "Save Changes"
                              ),
                          ]
                        : React.createElement(
                              "button",
                              {
                                  onClick: () => setEditMode(true),
                                  className:
                                      "px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm",
                              },
                              React.createElement("i", {
                                  className: "fas fa-edit mr-1",
                              }),
                              "Edit Structure"
                          )
                )
            ),

            // Content with scroll
            React.createElement(
                "div",
                { className: "flex-1 overflow-y-auto" },
                // Mobile Table
                isMobile
                    ? React.createElement(
                          "div",
                          { className: "divide-y divide-gray-200" },
                          ...fields.map((field, index) =>
                              React.createElement(
                                  "div",
                                  { key: field.name, className: "p-4" },
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-between mb-2",
                                      },
                                      React.createElement(
                                          "div",
                                          { className: "flex items-center" },
                                          React.createElement("i", {
                                              className: `fas fa-key mr-2 ${
                                                  isPrimaryKey(field)
                                                      ? "text-yellow-500"
                                                      : "text-gray-300"
                                              }`,
                                          }),
                                          React.createElement(
                                              "span",
                                              {
                                                  className:
                                                      "font-medium text-gray-900",
                                              },
                                              field.name
                                          )
                                      ),
                                      editMode &&
                                          React.createElement(
                                              "div",
                                              {
                                                  className:
                                                      "flex items-center space-x-2",
                                              },
                                              React.createElement(
                                                  "button",
                                                  {
                                                      onClick: () =>
                                                          setEditingField({
                                                              ...field,
                                                              index,
                                                          }),
                                                      className:
                                                          "text-blue-600 hover:text-blue-800 p-1",
                                                  },
                                                  React.createElement("i", {
                                                      className: "fas fa-edit",
                                                  })
                                              ),
                                              React.createElement(
                                                  "button",
                                                  {
                                                      onClick: () =>
                                                          handleDeleteField(
                                                              field.name
                                                          ),
                                                      className:
                                                          "text-red-600 hover:text-red-800 p-1",
                                                  },
                                                  React.createElement("i", {
                                                      className: "fas fa-trash",
                                                  })
                                              )
                                          )
                                  ),
                                  React.createElement(
                                      "div",
                                      { className: "flex flex-wrap gap-2" },
                                      renderFieldBadge(field),
                                      isRequired(field) &&
                                          React.createElement(
                                              "span",
                                              {
                                                  className:
                                                      "px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full",
                                              },
                                              "Required"
                                          ),
                                      isUnique(field) &&
                                          React.createElement(
                                              "span",
                                              {
                                                  className:
                                                      "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full",
                                              },
                                              "Unique"
                                          ),
                                      isPrimaryKey(field) &&
                                          React.createElement(
                                              "span",
                                              {
                                                  className:
                                                      "px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full",
                                              },
                                              "Primary Key"
                                          )
                                  )
                              )
                          )
                      )
                    : // Desktop Table
                      React.createElement(
                          "div",
                          { className: "overflow-x-auto" },
                          React.createElement(
                              "table",
                              {
                                  className:
                                      "min-w-full divide-y divide-gray-200",
                              },
                              React.createElement(
                                  "thead",
                                  { className: "bg-gray-50" },
                                  React.createElement(
                                      "tr",
                                      {},
                                      React.createElement(
                                          "th",
                                          {
                                              className:
                                                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                          },
                                          "Column"
                                      ),
                                      React.createElement(
                                          "th",
                                          {
                                              className:
                                                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                          },
                                          "Type"
                                      ),
                                      React.createElement(
                                          "th",
                                          {
                                              className:
                                                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                          },
                                          "Constraints"
                                      ),
                                      React.createElement(
                                          "th",
                                          {
                                              className:
                                                  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                          },
                                          "Options"
                                      ),
                                      editMode &&
                                          React.createElement(
                                              "th",
                                              {
                                                  className:
                                                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                              },
                                              "Actions"
                                          )
                                  )
                              ),
                              React.createElement(
                                  "tbody",
                                  {
                                      className:
                                          "bg-white divide-y divide-gray-200",
                                  },
                                  ...fields.map((field, index) =>
                                      React.createElement(
                                          "tr",
                                          {
                                              key: field.name,
                                              className: "hover:bg-gray-50",
                                          },
                                          React.createElement(
                                              "td",
                                              {
                                                  className:
                                                      "px-6 py-4 whitespace-nowrap",
                                              },
                                              React.createElement(
                                                  "div",
                                                  {
                                                      className:
                                                          "flex items-center",
                                                  },
                                                  React.createElement("i", {
                                                      className: `fas fa-key mr-2 ${
                                                          isPrimaryKey(field)
                                                              ? "text-yellow-500"
                                                              : "text-gray-300"
                                                      }`,
                                                  }),
                                                  React.createElement(
                                                      "span",
                                                      {
                                                          className:
                                                              "text-sm font-medium text-gray-900",
                                                      },
                                                      field.name
                                                  )
                                              )
                                          ),
                                          React.createElement(
                                              "td",
                                              {
                                                  className:
                                                      "px-6 py-4 whitespace-nowrap",
                                              },
                                              renderFieldBadge(field)
                                          ),
                                          React.createElement(
                                              "td",
                                              {
                                                  className:
                                                      "px-6 py-4 whitespace-nowrap",
                                              },
                                              React.createElement(
                                                  "div",
                                                  {
                                                      className:
                                                          "flex flex-wrap gap-1",
                                                  },
                                                  isRequired(field) &&
                                                      React.createElement(
                                                          "span",
                                                          {
                                                              className:
                                                                  "px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full",
                                                          },
                                                          "Required"
                                                      ),
                                                  isUnique(field) &&
                                                      React.createElement(
                                                          "span",
                                                          {
                                                              className:
                                                                  "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full",
                                                          },
                                                          "Unique"
                                                      )
                                              )
                                          ),
                                          React.createElement(
                                              "td",
                                              {
                                                  className:
                                                      "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
                                              },
                                              isPrimaryKey(field)
                                                  ? React.createElement(
                                                        "span",
                                                        {
                                                            className:
                                                                "px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full",
                                                        },
                                                        "Primary Key"
                                                    )
                                                  : React.createElement(
                                                        "span",
                                                        {
                                                            className:
                                                                "text-gray-400",
                                                        },
                                                        "—"
                                                    )
                                          ),
                                          editMode &&
                                              React.createElement(
                                                  "td",
                                                  {
                                                      className:
                                                          "px-6 py-4 whitespace-nowrap text-sm font-medium",
                                                  },
                                                  React.createElement(
                                                      "button",
                                                      {
                                                          onClick: () =>
                                                              setEditingField({
                                                                  ...field,
                                                                  index,
                                                              }),
                                                          className:
                                                              "text-blue-600 hover:text-blue-900 mr-3",
                                                      },
                                                      React.createElement("i", {
                                                          className:
                                                              "fas fa-edit",
                                                      })
                                                  ),
                                                  React.createElement(
                                                      "button",
                                                      {
                                                          onClick: () =>
                                                              handleDeleteField(
                                                                  field.name
                                                              ),
                                                          className:
                                                              "text-red-600 hover:text-red-900",
                                                      },
                                                      React.createElement("i", {
                                                          className:
                                                              "fas fa-trash",
                                                      })
                                                  )
                                              )
                                      )
                                  )
                              )
                          )
                      )
            ),

            // Add Field Button
            editMode &&
                React.createElement(
                    "div",
                    { className: "px-4 sm:px-6 py-4 border-t border-gray-200" },
                    React.createElement(
                        "button",
                        {
                            onClick: () => setShowAddField(true),
                            className:
                                "w-full sm:w-auto flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors",
                        },
                        React.createElement("i", {
                            className: "fas fa-plus mr-2",
                        }),
                        "Add Column"
                    )
                )
        ),

        // Edit Field Modal
        editingField &&
            window.AdvancedComponents &&
            React.createElement(window.AdvancedComponents.FieldEditModal, {
                field: editingField,
                onSave: handleSaveField,
                onCancel: () => setEditingField(null),
                isMobile: isMobile,
                schema: schema,
            }),

        // Add Field Modal
        showAddField &&
            window.AdvancedComponents &&
            React.createElement(window.AdvancedComponents.AddFieldModal, {
                onSave: async (fieldData) => {
                    try {
                        const response = await fetch(
                            "/ufo-studio/api/schema/field",
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    ...getAuthHeaders(),
                                },
                                body: JSON.stringify({
                                    modelName: model.name,
                                    field: fieldData,
                                }),
                            }
                        )

                        const result = await response.json()

                        if (result.success) {
                            showNotification("Field added successfully")
                            setFields((prev) => [...prev, fieldData])
                            setShowAddField(false)
                            if (onSchemaUpdate) onSchemaUpdate()
                        } else {
                            throw new Error(
                                result.message || "Failed to add field"
                            )
                        }
                    } catch (error) {
                        showNotification(
                            "Failed to add field: " + error.message,
                            "error"
                        )
                    }
                },
                onCancel: () => setShowAddField(false),
                isMobile: isMobile,
                schema: schema,
            })
    )
}

// Component: CreateRecordButton
function CreateRecordButton({
    modelName,
    schema,
    showNotification,
    compact = false,
    onRecordCreated,
}) {
    const [showModal, setShowModal] = React.useState(false)

    const model = schema?.parsed?.models?.find((m) => m.name === modelName)

    const handleCreate = async (processedData) => {
        try {
            const apiUrl = `/api/v1/${modelName}`

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(processedData),
            })

            if (response.status === 201) {
                showNotification("Record created successfully")
                setShowModal(false)
                if (onRecordCreated) onRecordCreated()
            } else {
                const result = await response.json()
                throw new Error(result.message || "Failed to create record")
            }
        } catch (error) {
            console.error("Create record error:", error)
            showNotification(
                `Failed to create record: ${error.message}`,
                "error"
            )
            throw error
        }
    }

    // Use global getAuthHeaders function

    if (!model) return null

    return React.createElement(
        "div",
        {},
        React.createElement(
            "button",
            {
                onClick: () => setShowModal(true),
                className:
                    "inline-flex items-center px-2 sm:px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm",
            },
            React.createElement("i", { className: "fas fa-plus mr-1" }),
            !compact && React.createElement("span", {}, "New Record")
        ),

        showModal &&
            window.AdvancedComponents &&
            React.createElement(window.AdvancedComponents.EditRecordModal, {
                record: {},
                model: model,
                onSave: handleCreate,
                onCancel: () => setShowModal(false),
                isMobile: compact,
                schema: schema,
                isCreating: true,
            })
    )
}

// Component: ModelData
function ModelData({ model, showNotification, isMobile }) {
    const [data, setData] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)
    const [currentPage, setCurrentPage] = React.useState(1)
    const [totalRecords, setTotalRecords] = React.useState(0)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [pageSize, setPageSize] = React.useState(25)
    const [editingRecord, setEditingRecord] = React.useState(null)

    const fetchData = React.useCallback(
        async (page = 1, search = "") => {
            setLoading(true)
            setError(null)
            try {
                const apiUrl = `/api/v1/${model.name}`

                const searchParam = search
                    ? `&search=${encodeURIComponent(search)}`
                    : ""
                const url = `${apiUrl}?limit=${pageSize}&offset=${
                    (page - 1) * pageSize
                }${searchParam}`

                const response = await fetch(url, {
                    headers: getAuthHeaders(),
                })

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    )
                }

                const result = await response.json()

                if (result.data) {
                    setData(result.data || [])
                    setTotalRecords(result.meta.pagination.total || 0)
                    setCurrentPage(page)
                } else {
                    throw new Error("Invalid response format")
                }
            } catch (error) {
                console.error("Data fetch error:", error)
                setError(error.message)
                showNotification(
                    `Failed to load data: ${error.message}`,
                    "error"
                )
            } finally {
                setLoading(false)
            }
        },
        [model.name, pageSize, showNotification]
    )

    React.useEffect(() => {
        fetchData(currentPage, searchTerm)
    }, [fetchData, currentPage, searchTerm])

    const updateRecord = async (updatedData) => {
        try {
            const apiUrl = `/api/v1/${model.name}/${updatedData.id}`

            const response = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(updatedData),
            })

            if (response.status === 200) {
                showNotification("Record updated successfully")
                fetchData(currentPage, searchTerm)
            } else {
                throw new Error("Failed to update record")
            }
        } catch (error) {
            console.error("Update record error:", error)
            showNotification(
                `Failed to update record: ${error.message}`,
                "error"
            )
        }
    }

    if (loading && data.length === 0) {
        return React.createElement(
            "div",
            { className: "p-4 sm:p-6 h-full flex flex-col" },
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex-1 flex items-center justify-center",
                },
                React.createElement(
                    "div",
                    { className: "flex items-center" },
                    React.createElement("div", {
                        className:
                            "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3",
                    }),
                    React.createElement(
                        "span",
                        { className: "text-gray-600" },
                        "Loading data..."
                    )
                )
            )
        )
    }

    if (error) {
        return React.createElement(
            "div",
            { className: "p-4 sm:p-6 h-full flex flex-col" },
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex-1 flex items-center justify-center",
                },
                React.createElement(
                    "div",
                    { className: "text-center" },
                    React.createElement("i", {
                        className:
                            "fas fa-exclamation-triangle text-red-500 text-4xl mb-4",
                    }),
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900 mb-2" },
                        "Error Loading Data"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-gray-600 mb-4" },
                        error
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: () => fetchData(currentPage, searchTerm),
                            className:
                                "px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors",
                        },
                        React.createElement("i", {
                            className: "fas fa-retry mr-2",
                        }),
                        "Retry"
                    )
                )
            )
        )
    }

    const totalPages = Math.ceil(totalRecords / pageSize)

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full flex flex-col" },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full",
            },
            // Header with Search
            React.createElement(
                "div",
                { className: "px-4 sm:px-6 py-4 border-b border-gray-200" },
                React.createElement(
                    "div",
                    {
                        className:
                            "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0",
                    },
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "h3",
                            { className: "text-lg font-medium text-gray-900" },
                            "Data"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-gray-500 mt-1" },
                            `${totalRecords} record${
                                totalRecords !== 1 ? "s" : ""
                            } total`
                        )
                    ),
                    React.createElement(
                        "div",
                        {
                            className:
                                "flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3",
                        },
                        React.createElement(
                            "div",
                            { className: "relative" },
                            React.createElement("input", {
                                type: "text",
                                placeholder: "Search records...",
                                value: searchTerm,
                                onChange: (e) => setSearchTerm(e.target.value),
                                className:
                                    "w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                            }),
                            React.createElement("i", {
                                className:
                                    "fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm",
                            })
                        ),
                        React.createElement(CreateRecordButton, {
                            modelName: model.name,
                            schema: { parsed: { models: [model] } },
                            showNotification: showNotification,
                            compact: isMobile,
                        })
                    )
                )
            ),

            // Data display
            React.createElement(
                "div",
                { className: "flex-1 overflow-y-auto" },
                data.length === 0
                    ? React.createElement(
                          "div",
                          { className: "p-8 text-center" },
                          React.createElement("i", {
                              className:
                                  "fas fa-database text-gray-300 text-4xl mb-4",
                          }),
                          React.createElement(
                              "h3",
                              {
                                  className:
                                      "text-lg font-medium text-gray-900 mb-2",
                              },
                              "No Records Found"
                          ),
                          React.createElement(
                              "p",
                              { className: "text-gray-600 mb-4" },
                              searchTerm
                                  ? "No records match your search criteria."
                                  : "This table is empty."
                          ),
                          React.createElement(CreateRecordButton, {
                              modelName: model.name,
                              schema: { parsed: { models: [model] } },
                              showNotification: showNotification,
                              onRecordCreated: () =>
                                  fetchData(currentPage, searchTerm),
                          })
                      )
                    : isMobile
                    ? // Mobile Card View
                      React.createElement(
                          "div",
                          { className: "divide-y divide-gray-200" },
                          ...data.map((record, index) =>
                              React.createElement(
                                  "div",
                                  { key: record.id || index, className: "p-4" },
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-between mb-2",
                                      },
                                      React.createElement(
                                          "h4",
                                          { className: "font-medium" },
                                          `Record #${record.id}`
                                      ),
                                      React.createElement(EditRecordButton, {
                                          record: record,
                                          model: model,
                                          onEdit: () =>
                                              setEditingRecord(record),
                                          compact: true,
                                      })
                                  ),
                                  React.createElement(
                                      "div",
                                      { className: "space-y-2" },
                                      ...Object.entries(record).map(
                                          ([key, value]) =>
                                              React.createElement(
                                                  "div",
                                                  {
                                                      key,
                                                      className:
                                                          "flex justify-between",
                                                  },
                                                  React.createElement(
                                                      "span",
                                                      {
                                                          className:
                                                              "text-sm font-medium text-gray-500",
                                                      },
                                                      `${key}:`
                                                  ),
                                                  React.createElement(
                                                      "span",
                                                      {
                                                          className:
                                                              "text-sm text-gray-900 text-right max-w-xs truncate",
                                                      },
                                                      value !== null &&
                                                          value !== undefined
                                                          ? String(value)
                                                          : "—"
                                                  )
                                              )
                                      )
                                  )
                              )
                          )
                      )
                    : // Desktop Table View
                      React.createElement(
                          "div",
                          { className: "overflow-x-auto" },
                          React.createElement(
                              "table",
                              {
                                  className:
                                      "min-w-full divide-y divide-gray-200",
                              },
                              React.createElement(
                                  "thead",
                                  { className: "bg-gray-50 sticky top-0" },
                                  React.createElement(
                                      "tr",
                                      {},
                                      ...Object.keys(data[0] || {}).map((key) =>
                                          React.createElement(
                                              "th",
                                              {
                                                  key,
                                                  className:
                                                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                                              },
                                              key
                                          )
                                      ),
                                      React.createElement(
                                          "th",
                                          {
                                              className:
                                                  "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",
                                          },
                                          "Actions"
                                      )
                                  )
                              ),
                              React.createElement(
                                  "tbody",
                                  {
                                      className:
                                          "bg-white divide-y divide-gray-200",
                                  },
                                  ...data.map((record, index) =>
                                      React.createElement(
                                          "tr",
                                          {
                                              key: record.id || index,
                                              className: "hover:bg-gray-50",
                                          },
                                          ...Object.values(record).map(
                                              (value, cellIndex) =>
                                                  React.createElement(
                                                      "td",
                                                      {
                                                          key: cellIndex,
                                                          className:
                                                              "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
                                                      },
                                                      value !== null &&
                                                          value !== undefined
                                                          ? String(value)
                                                          : "—"
                                                  )
                                          ),
                                          React.createElement(
                                              "td",
                                              {
                                                  className:
                                                      "px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right",
                                              },
                                              React.createElement(
                                                  EditRecordButton,
                                                  {
                                                      record: record,
                                                      model: model,
                                                      onEdit: () =>
                                                          setEditingRecord(
                                                              record
                                                          ),
                                                  }
                                              )
                                          )
                                      )
                                  )
                              )
                          )
                      )
            ),

            // Pagination
            totalPages > 1 &&
                React.createElement(
                    "div",
                    { className: "px-4 sm:px-6 py-3 border-t border-gray-200" },
                    React.createElement(
                        "div",
                        {
                            className:
                                "flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0",
                        },
                        React.createElement(
                            "div",
                            { className: "text-sm text-gray-700" },
                            `Showing ${
                                (currentPage - 1) * pageSize + 1
                            } to ${Math.min(
                                currentPage * pageSize,
                                totalRecords
                            )} of ${totalRecords} results`
                        ),
                        React.createElement(
                            "div",
                            { className: "flex items-center space-x-2" },
                            React.createElement(
                                "button",
                                {
                                    onClick: () =>
                                        setCurrentPage((prev) =>
                                            Math.max(1, prev - 1)
                                        ),
                                    disabled: currentPage === 1,
                                    className:
                                        "px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50",
                                },
                                "Previous"
                            ),
                            React.createElement(
                                "span",
                                { className: "text-sm text-gray-700" },
                                `Page ${currentPage} of ${totalPages}`
                            ),
                            React.createElement(
                                "button",
                                {
                                    onClick: () =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        ),
                                    disabled: currentPage === totalPages,
                                    className:
                                        "px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50",
                                },
                                "Next"
                            )
                        )
                    )
                )
        ),

        // Edit Record Modal
        editingRecord &&
            window.AdvancedComponents &&
            React.createElement(window.AdvancedComponents.EditRecordModal, {
                record: editingRecord,
                model: model,
                onSave: (updatedData) => {
                    updateRecord(updatedData)
                    setEditingRecord(null)
                },
                onCancel: () => setEditingRecord(null),
                isMobile: isMobile,
                schema: { parsed: { models: [model] } },
            })
    )
}

// Component: EditRecordButton
function EditRecordButton({ record, model, onEdit, compact = false }) {
    return React.createElement(
        "button",
        {
            onClick: onEdit,
            className:
                "inline-flex items-center px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm",
        },
        React.createElement("i", { className: "fas fa-edit mr-1" }),
        !compact && React.createElement("span", {}, "Edit")
    )
}

// Component: ModelRelationships
function ModelRelationships({ model, schema, isMobile }) {
    const getRelationships = () => {
        const outgoing = []
        const incoming = []

        // Find outgoing relationships from this model
        model.fields.forEach((field) => {
            if (field.type.includes("@relation")) {
                const targetModel = field.type.split(" ")[0].replace("[]", "")
                const isArray = field.type.includes("[]")
                let relationType = isArray ? "One-to-Many" : "One-to-One"

                if (field.type.includes("references: [") && isArray) {
                    relationType = "Many-to-Many"
                }

                outgoing.push({
                    field: field.name,
                    targetModel,
                    type: relationType,
                    description: `${model.name}.${field.name} → ${targetModel}`,
                })
            }
        })

        // Find incoming relationships to this model
        schema?.parsed?.models?.forEach((otherModel) => {
            if (otherModel.name !== model.name) {
                otherModel.fields.forEach((field) => {
                    if (
                        field.type.includes("@relation") &&
                        field.type.split(" ")[0].replace("[]", "") ===
                            model.name
                    ) {
                        const isArray = field.type.includes("[]")
                        let relationType = isArray
                            ? "Many-to-One"
                            : "One-to-One"

                        if (field.type.includes("references: [") && isArray) {
                            relationType = "Many-to-Many"
                        }

                        incoming.push({
                            field: field.name,
                            sourceModel: otherModel.name,
                            type: relationType,
                            description: `${otherModel.name}.${field.name} → ${model.name}`,
                        })
                    }
                })
            }
        })

        return { outgoing, incoming }
    }

    const { outgoing, incoming } = getRelationships()

    const getRelationIcon = (type) => {
        switch (type) {
            case "One-to-One":
                return "fa-arrows-alt-h"
            case "One-to-Many":
                return "fa-arrow-right"
            case "Many-to-One":
                return "fa-arrow-left"
            case "Many-to-Many":
                return "fa-exchange-alt"
            default:
                return "fa-link"
        }
    }

    const getRelationColor = (type) => {
        switch (type) {
            case "One-to-One":
                return "text-blue-500 bg-blue-50"
            case "One-to-Many":
                return "text-green-500 bg-green-50"
            case "Many-to-One":
                return "text-purple-500 bg-purple-50"
            case "Many-to-Many":
                return "text-orange-500 bg-orange-50"
            default:
                return "text-gray-500 bg-gray-50"
        }
    }

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full flex flex-col" },
        React.createElement(
            "div",
            { className: "flex-1 overflow-y-auto space-y-6" },
            // Relationship Legend
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
                },
                React.createElement(
                    "h3",
                    { className: "text-sm font-medium text-gray-900 mb-3" },
                    "Relationship Types"
                ),
                React.createElement(
                    "div",
                    { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" },
                    [
                        "One-to-One",
                        "One-to-Many",
                        "Many-to-One",
                        "Many-to-Many",
                    ].map((type) =>
                        React.createElement(
                            "div",
                            { key: type, className: "flex items-start" },
                            React.createElement(
                                "div",
                                {
                                    className: `w-8 h-8 rounded-full flex items-center justify-center mr-2 ${getRelationColor(
                                        type
                                    )}`,
                                },
                                React.createElement("i", {
                                    className: `fas ${getRelationIcon(type)}`,
                                })
                            ),
                            React.createElement(
                                "div",
                                {},
                                React.createElement(
                                    "div",
                                    { className: "font-medium text-sm" },
                                    type
                                ),
                                React.createElement(
                                    "div",
                                    { className: "text-xs text-gray-500" },
                                    "Relationship type"
                                )
                            )
                        )
                    )
                )
            ),

            // Outgoing Relationships
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200",
                },
                React.createElement(
                    "div",
                    { className: "px-4 sm:px-6 py-4 border-b border-gray-200" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Outgoing Relationships"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        `Relationships from ${model.name} to other models`
                    )
                ),

                outgoing.length === 0
                    ? React.createElement(
                          "div",
                          { className: "p-6 text-center" },
                          React.createElement("i", {
                              className:
                                  "fas fa-arrow-right text-gray-300 text-4xl mb-4",
                          }),
                          React.createElement(
                              "p",
                              { className: "text-gray-500" },
                              "No outgoing relationships found"
                          )
                      )
                    : React.createElement(
                          "div",
                          { className: "divide-y divide-gray-200" },
                          ...outgoing.map((rel, index) =>
                              React.createElement(
                                  "div",
                                  { key: index, className: "p-4 sm:p-6" },
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-between mb-2",
                                      },
                                      React.createElement(
                                          "div",
                                          { className: "flex items-center" },
                                          React.createElement(
                                              "div",
                                              {
                                                  className: `w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getRelationColor(
                                                      rel.type
                                                  )}`,
                                              },
                                              React.createElement("i", {
                                                  className: `fas ${getRelationIcon(
                                                      rel.type
                                                  )}`,
                                              })
                                          ),
                                          React.createElement(
                                              "div",
                                              {},
                                              React.createElement(
                                                  "div",
                                                  { className: "font-medium" },
                                                  rel.field
                                              ),
                                              React.createElement(
                                                  "div",
                                                  {
                                                      className:
                                                          "text-sm text-gray-500",
                                                  },
                                                  rel.description
                                              )
                                          )
                                      ),
                                      React.createElement(
                                          "span",
                                          {
                                              className: `px-3 py-1 rounded-full text-xs font-medium ${getRelationColor(
                                                  rel.type
                                              )}`,
                                          },
                                          rel.type
                                      )
                                  ),
                                  React.createElement(
                                      "div",
                                      { className: "mt-2 text-sm" },
                                      React.createElement(
                                          "span",
                                          { className: "text-gray-500" },
                                          "Target Model: "
                                      ),
                                      React.createElement(
                                          "span",
                                          { className: "font-medium ml-1" },
                                          rel.targetModel
                                      )
                                  )
                              )
                          )
                      )
            ),

            // Incoming Relationships
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200",
                },
                React.createElement(
                    "div",
                    { className: "px-4 sm:px-6 py-4 border-b border-gray-200" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Incoming Relationships"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        `Relationships from other models to ${model.name}`
                    )
                ),

                incoming.length === 0
                    ? React.createElement(
                          "div",
                          { className: "p-6 text-center" },
                          React.createElement("i", {
                              className:
                                  "fas fa-arrow-left text-gray-300 text-4xl mb-4",
                          }),
                          React.createElement(
                              "p",
                              { className: "text-gray-500" },
                              "No incoming relationships found"
                          )
                      )
                    : React.createElement(
                          "div",
                          { className: "divide-y divide-gray-200" },
                          ...incoming.map((rel, index) =>
                              React.createElement(
                                  "div",
                                  { key: index, className: "p-4 sm:p-6" },
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-between mb-2",
                                      },
                                      React.createElement(
                                          "div",
                                          { className: "flex items-center" },
                                          React.createElement(
                                              "div",
                                              {
                                                  className: `w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getRelationColor(
                                                      rel.type
                                                  )}`,
                                              },
                                              React.createElement("i", {
                                                  className: `fas ${getRelationIcon(
                                                      rel.type
                                                  )}`,
                                              })
                                          ),
                                          React.createElement(
                                              "div",
                                              {},
                                              React.createElement(
                                                  "div",
                                                  { className: "font-medium" },
                                                  rel.field
                                              ),
                                              React.createElement(
                                                  "div",
                                                  {
                                                      className:
                                                          "text-sm text-gray-500",
                                                  },
                                                  rel.description
                                              )
                                          )
                                      ),
                                      React.createElement(
                                          "span",
                                          {
                                              className: `px-3 py-1 rounded-full text-xs font-medium ${getRelationColor(
                                                  rel.type
                                              )}`,
                                          },
                                          rel.type
                                      )
                                  ),
                                  React.createElement(
                                      "div",
                                      { className: "mt-2 text-sm" },
                                      React.createElement(
                                          "span",
                                          { className: "text-gray-500" },
                                          "Source Model: "
                                      ),
                                      React.createElement(
                                          "span",
                                          { className: "font-medium ml-1" },
                                          rel.sourceModel
                                      )
                                  )
                              )
                          )
                      )
            )
        )
    )
}

// Component: EnumEditor
function EnumEditor({ enumItem, showNotification, onSchemaUpdate, isMobile }) {
    const [editMode, setEditMode] = React.useState(false)
    const [enumData, setEnumData] = React.useState({
        name: enumItem.name,
        values: [...enumItem.values],
    })
    const [saving, setSaving] = React.useState(false)

    const addValue = () => {
        setEnumData((prev) => ({
            ...prev,
            values: [...prev.values, ""],
        }))
    }

    const updateValue = (index, value) => {
        setEnumData((prev) => ({
            ...prev,
            values: prev.values.map((v, i) => (i === index ? value : v)),
        }))
    }

    const removeValue = (index) => {
        setEnumData((prev) => ({
            ...prev,
            values: prev.values.filter((_, i) => i !== index),
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            const validValues = enumData.values.filter((v) => v.trim() !== "")

            if (validValues.length === 0) {
                showNotification("Enum must have at least one value", "error")
                return
            }

            const response = await fetch(
                `/ufo-studio/api/schema/enum/${enumItem.name}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({ values: validValues }),
                }
            )

            const result = await response.json()
            if (result.success) {
                showNotification("Enum updated successfully")
                setEditMode(false)
                if (onSchemaUpdate) onSchemaUpdate()
            } else {
                throw new Error(result.message || "Failed to update enum")
            }
        } catch (error) {
            showNotification("Failed to update enum: " + error.message, "error")
        } finally {
            setSaving(false)
        }
    }

    // Use global getAuthHeaders function

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6" },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-sm border border-gray-200",
            },
            // Header
            React.createElement(
                "div",
                {
                    className:
                        "px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between",
                },
                React.createElement(
                    "div",
                    {},
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Enum Values"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        `${enumData.values.length} values`
                    )
                ),
                React.createElement(
                    "div",
                    { className: "flex items-center space-x-2" },
                    editMode
                        ? [
                              React.createElement(
                                  "button",
                                  {
                                      key: "cancel",
                                      onClick: () => setEditMode(false),
                                      className:
                                          "px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm",
                                  },
                                  React.createElement("i", {
                                      className: "fas fa-times mr-1",
                                  }),
                                  "Cancel"
                              ),
                              React.createElement(
                                  "button",
                                  {
                                      key: "save",
                                      onClick: handleSave,
                                      disabled: saving,
                                      className:
                                          "px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50",
                                  },
                                  saving
                                      ? [
                                            React.createElement("i", {
                                                key: "icon",
                                                className:
                                                    "fas fa-spinner fa-spin mr-1",
                                            }),
                                            "Saving...",
                                        ]
                                      : [
                                            React.createElement("i", {
                                                key: "icon",
                                                className: "fas fa-check mr-1",
                                            }),
                                            "Save Changes",
                                        ]
                              ),
                          ]
                        : React.createElement(
                              "button",
                              {
                                  onClick: () => setEditMode(true),
                                  className:
                                      "px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm",
                              },
                              React.createElement("i", {
                                  className: "fas fa-edit mr-1",
                              }),
                              "Edit Values"
                          )
                )
            ),

            // Values List
            React.createElement(
                "div",
                { className: "p-4 sm:p-6" },
                React.createElement(
                    "div",
                    { className: "space-y-3" },
                    ...enumData.values.map((value, index) =>
                        React.createElement(
                            "div",
                            {
                                key: index,
                                className: "flex items-center space-x-3",
                            },
                            React.createElement(
                                "div",
                                {
                                    className:
                                        "flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center",
                                },
                                React.createElement(
                                    "span",
                                    {
                                        className:
                                            "text-sm font-medium text-purple-600",
                                    },
                                    index + 1
                                )
                            ),
                            editMode
                                ? React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex-1 flex items-center space-x-2",
                                      },
                                      React.createElement("input", {
                                          type: "text",
                                          value: value,
                                          onChange: (e) =>
                                              updateValue(
                                                  index,
                                                  e.target.value
                                              ),
                                          className:
                                              "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                                          placeholder: "Enter enum value",
                                      }),
                                      React.createElement(
                                          "button",
                                          {
                                              onClick: () => removeValue(index),
                                              className:
                                                  "p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors",
                                          },
                                          React.createElement("i", {
                                              className: "fas fa-trash text-sm",
                                          })
                                      )
                                  )
                                : React.createElement(
                                      "div",
                                      { className: "flex-1" },
                                      React.createElement(
                                          "span",
                                          {
                                              className:
                                                  "text-sm font-medium text-gray-900",
                                          },
                                          value
                                      )
                                  )
                        )
                    )
                ),

                // Add Value Button
                editMode &&
                    React.createElement(
                        "div",
                        { className: "mt-4 pt-4 border-t border-gray-200" },
                        React.createElement(
                            "button",
                            {
                                onClick: addValue,
                                className:
                                    "w-full sm:w-auto flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors",
                            },
                            React.createElement("i", {
                                className: "fas fa-plus mr-2",
                            }),
                            "Add Value"
                        )
                    )
            )
        )
    )
}

// Component: SchemaOverview
function SchemaOverview({ schema, isMobile, onModelDoubleClick }) {
    const [selectedFilter, setSelectedFilter] = React.useState("all")
    const [selectedModel, setSelectedModel] = React.useState(null)

    const models = schema?.parsed?.models || []
    const enums = schema?.parsed?.enums || []

    // Filter models based on selection - memoized to prevent re-renders
    const filteredModels = React.useMemo(() => {
        return models.filter((model) => {
            if (selectedFilter === "all") return true
            if (selectedFilter === "relations") {
                return model.fields.some((field) =>
                    models.some(
                        (m) =>
                            m.name ===
                            field.type
                                .split(" ")[0]
                                .replace("[]", "")
                                .replace("?", "")
                    )
                )
            }
            return true
        })
    }, [models, selectedFilter])

    // Create filtered schema for ERDiagram component - memoized to prevent re-renders
    const filteredSchema = React.useMemo(() => {
        return {
            ...schema,
            parsed: {
                ...schema?.parsed,
                models: filteredModels,
                enums: enums,
            },
        }
    }, [schema, filteredModels, enums])

    // Generate relationships - memoized to prevent re-calculations
    const relationships = React.useMemo(() => {
        const rels = []

        filteredModels.forEach((model) => {
            model.fields.forEach((field) => {
                const fieldType = field.type
                    .split(" ")[0]
                    .replace("[]", "")
                    .replace("?", "")
                const targetModel = filteredModels.find(
                    (m) => m.name === fieldType
                )

                if (targetModel && model.name !== targetModel.name) {
                    const isArray = field.type.includes("[]")
                    const isOptional = field.type.includes("?")

                    rels.push({
                        from: model.name,
                        to: targetModel.name,
                        field: field.name,
                        type: isArray ? "one-to-many" : "one-to-one",
                        optional: isOptional,
                    })
                }
            })
        })

        return rels
    }, [filteredModels])

    // Handle model click from ERDiagram - memoized to prevent unnecessary re-renders
    const handleModelClick = React.useCallback(
        (model) => {
            setSelectedModel(model.name === selectedModel ? null : model.name)
            console.log("Model clicked:", model.name)
        },
        [selectedModel]
    )

    // Handle relationship click from ERDiagram - memoized to prevent unnecessary re-renders
    const handleRelationshipClick = React.useCallback((relationship) => {
        console.log("Relationship clicked:", relationship)
    }, [])

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full flex flex-col" },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full",
            },
            // Header with Controls
            React.createElement(
                "div",
                { className: "px-4 sm:px-6 py-4 border-b border-gray-200" },
                React.createElement(
                    "div",
                    {
                        className:
                            "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0",
                    },
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "h3",
                            { className: "text-lg font-medium text-gray-900" },
                            "Database Schema Overview"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-gray-500 mt-1" },
                            "Interactive ER diagram showing all models and relationships"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "flex items-center space-x-3" },
                        React.createElement(
                            "select",
                            {
                                value: selectedFilter,
                                onChange: (e) => {
                                    setSelectedFilter(e.target.value)
                                    setSelectedModel(null) // Reset selection when filter changes
                                },
                                className:
                                    "px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            },
                            React.createElement(
                                "option",
                                { value: "all" },
                                "All Models"
                            ),
                            React.createElement(
                                "option",
                                { value: "relations" },
                                "Models with Relations"
                            )
                        ),
                        selectedModel &&
                            React.createElement(
                                "button",
                                {
                                    onClick: () => setSelectedModel(null),
                                    className:
                                        "px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors",
                                },
                                React.createElement("i", {
                                    className: "fas fa-times mr-1",
                                }),
                                "Clear Selection"
                            )
                    )
                )
            ),
            // Selected Model Info
            selectedModel &&
                React.createElement(
                    "div",
                    {
                        className:
                            "px-4 sm:px-6 py-2 bg-blue-50 border-b border-blue-200",
                    },
                    React.createElement(
                        "div",
                        { className: "flex items-center justify-between" },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-table text-blue-600 mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "font-medium text-blue-900" },
                                `Selected: ${selectedModel}`
                            ),
                            React.createElement(
                                "span",
                                { className: "ml-2 text-sm text-blue-700" },
                                `(${
                                    filteredModels.find(
                                        (m) => m.name === selectedModel
                                    )?.fields?.length || 0
                                } fields)`
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "text-xs text-blue-600" },
                            "Click models to select • Drag models or background to move • Use controls to zoom and pan"
                        )
                    )
                ),

            // Interactive ER Diagram
            React.createElement(
                "div",
                { className: "flex-1 relative overflow-hidden" },
                filteredModels.length > 0
                    ? React.createElement(
                          window.UIComponents?.ERDiagram ||
                              (() =>
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-center h-full text-gray-500",
                                      },
                                      React.createElement(
                                          "div",
                                          { className: "text-center" },
                                          React.createElement("i", {
                                              className:
                                                  "fas fa-exclamation-triangle text-2xl mb-2",
                                          }),
                                          React.createElement(
                                              "p",
                                              {},
                                              "ERDiagram component not loaded"
                                          ),
                                          React.createElement(
                                              "p",
                                              { className: "text-xs" },
                                              "Check that ERDiagram.js is properly loaded"
                                          )
                                      )
                                  )),
                          {
                              schema: filteredSchema,
                              onModelClick: handleModelClick,
                              onModelDoubleClick: onModelDoubleClick,
                              onRelationshipClick: handleRelationshipClick,
                              className: "border-primary",
                              height: "100%",
                              width: "100%",
                          }
                      )
                    : React.createElement(
                          "div",
                          {
                              className:
                                  "flex items-center justify-center h-full",
                          },
                          React.createElement(
                              "div",
                              { className: "text-center" },
                              React.createElement(
                                  "div",
                                  {
                                      className:
                                          "w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4",
                                  },
                                  React.createElement("i", {
                                      className:
                                          "fas fa-search text-gray-400 text-2xl",
                                  })
                              ),
                              React.createElement(
                                  "h3",
                                  {
                                      className:
                                          "text-lg font-medium text-gray-500 mb-2",
                                  },
                                  "No Models Found"
                              ),
                              React.createElement(
                                  "p",
                                  { className: "text-gray-400" },
                                  selectedFilter === "relations"
                                      ? "No models with relationships match the current filter"
                                      : "No models found in schema"
                              ),
                              selectedFilter === "relations" &&
                                  React.createElement(
                                      "button",
                                      {
                                          onClick: () =>
                                              setSelectedFilter("all"),
                                          className:
                                              "mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors",
                                      },
                                      "Show All Models"
                                  )
                          )
                      )
            ),

            // Help Footer
            React.createElement(
                "div",
                {
                    className:
                        "px-4 sm:px-6 py-2 bg-gray-50 border-t border-gray-200",
                },
                React.createElement(
                    "div",
                    {
                        className:
                            "flex flex-wrap items-center justify-between text-xs text-gray-600",
                    },
                    React.createElement(
                        "div",
                        { className: "flex flex-wrap gap-4" },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-mouse-pointer mr-1",
                            }),
                            "Click models to select"
                        ),
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-arrows-alt mr-1",
                            }),
                            "Drag models or background"
                        ),
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-search-plus mr-1",
                            }),
                            "Scroll to zoom"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "text-gray-500" },
                        `${filteredModels.length} models • ${relationships.length} relationships`
                    )
                )
            )
        )
    )
}

// Component: ModelERDiagram - ER Diagram for single model
function ModelERDiagram({ model, schema, isMobile, onModelDoubleClick }) {
    const [selectedModel, setSelectedModel] = React.useState(model?.name)
    const [focusMode, setFocusMode] = React.useState("related") // 'related', 'all', 'direct'

    const generateModelDiagram = () => {
        const models = schema?.parsed?.models || []

        // Find related models based on focus mode
        const relatedModels = new Set()
        relatedModels.add(model.name)

        if (focusMode === "direct") {
            // Only direct relationships
            model.fields.forEach((field) => {
                const fieldType = field.type
                    .split(" ")[0]
                    .replace("[]", "")
                    .replace("?", "")
                const referencedModel = models.find((m) => m.name === fieldType)
                if (referencedModel) {
                    relatedModels.add(referencedModel.name)
                }
            })
        } else if (focusMode === "related") {
            // Add models that this model references
            model.fields.forEach((field) => {
                const fieldType = field.type
                    .split(" ")[0]
                    .replace("[]", "")
                    .replace("?", "")
                const referencedModel = models.find((m) => m.name === fieldType)
                if (referencedModel) {
                    relatedModels.add(referencedModel.name)
                }
            })

            // Add models that reference this model
            models.forEach((otherModel) => {
                if (otherModel.name !== model.name) {
                    otherModel.fields.forEach((field) => {
                        const fieldType = field.type
                            .split(" ")[0]
                            .replace("[]", "")
                            .replace("?", "")
                        if (fieldType === model.name) {
                            relatedModels.add(otherModel.name)
                        }
                    })
                }
            })
        } else if (focusMode === "all") {
            // All models
            models.forEach((m) => relatedModels.add(m.name))
        }

        const relevantModels = models.filter((m) => relatedModels.has(m.name))
        return relevantModels
    }

    const diagramModels = React.useMemo(
        () => generateModelDiagram(),
        [model.name, focusMode, schema?.parsed?.models]
    )

    // Create filtered schema for ERDiagram component - memoized to prevent re-renders
    const filteredSchema = React.useMemo(() => {
        return {
            ...schema,
            parsed: {
                ...schema?.parsed,
                models: diagramModels,
                enums: schema?.parsed?.enums || [],
            },
        }
    }, [schema, diagramModels])

    // Handle model click from ERDiagram - memoized to prevent unnecessary re-renders
    const handleModelClick = React.useCallback(
        (clickedModel) => {
            setSelectedModel(
                clickedModel.name === selectedModel ? null : clickedModel.name
            )
            console.log("Model clicked:", clickedModel.name)
        },
        [selectedModel]
    )

    // Handle relationship click from ERDiagram - memoized to prevent unnecessary re-renders
    const handleRelationshipClick = React.useCallback((relationship) => {
        console.log("Relationship clicked:", relationship)
    }, [])

    // Calculate statistics - memoized to prevent re-calculations
    const relationships = React.useMemo(() => {
        const rels = []
        diagramModels.forEach((fromModel) => {
            fromModel.fields.forEach((field) => {
                const fieldType = field.type
                    .split(" ")[0]
                    .replace("[]", "")
                    .replace("?", "")
                const toModel = diagramModels.find((m) => m.name === fieldType)

                if (toModel && fromModel.name !== toModel.name) {
                    const isArray = field.type.includes("[]")
                    const isOptional = field.type.includes("?")

                    rels.push({
                        from: fromModel.name,
                        to: toModel.name,
                        field: field.name,
                        type: isArray ? "one-to-many" : "one-to-one",
                        optional: isOptional,
                    })
                }
            })
        })
        return rels
    }, [diagramModels])

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full flex flex-col" },
        React.createElement(
            "div",
            {
                className:
                    "bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full",
            },
            // Header with Controls
            React.createElement(
                "div",
                { className: "px-4 sm:px-6 py-4 border-b border-gray-200" },
                React.createElement(
                    "div",
                    {
                        className:
                            "flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0",
                    },
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "h3",
                            { className: "text-lg font-medium text-gray-900" },
                            React.createElement("i", {
                                className: "fas fa-table text-blue-500 mr-2",
                            }),
                            `ER Diagram - ${model.name}`
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-gray-500 mt-1" },
                            `Interactive diagram showing ${model.name} and its relationships`
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "flex items-center space-x-3" },
                        React.createElement(
                            "select",
                            {
                                value: focusMode,
                                onChange: (e) => {
                                    setFocusMode(e.target.value)
                                    setSelectedModel(model.name) // Reset to main model
                                },
                                className:
                                    "px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                            },
                            React.createElement(
                                "option",
                                { value: "direct" },
                                "Direct Relations"
                            ),
                            React.createElement(
                                "option",
                                { value: "related" },
                                "Related Models"
                            ),
                            React.createElement(
                                "option",
                                { value: "all" },
                                "All Models"
                            )
                        ),
                        selectedModel &&
                            selectedModel !== model.name &&
                            React.createElement(
                                "button",
                                {
                                    onClick: () => setSelectedModel(model.name),
                                    className:
                                        "px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors",
                                },
                                React.createElement("i", {
                                    className: "fas fa-crosshairs mr-1",
                                }),
                                "Focus Main"
                            )
                    )
                )
            ),

            // Statistics Bar
            React.createElement(
                "div",
                {
                    className:
                        "px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50",
                },
                React.createElement(
                    "div",
                    { className: "grid grid-cols-3 gap-4 text-sm" },
                    React.createElement(
                        "div",
                        { className: "text-center" },
                        React.createElement(
                            "div",
                            { className: "font-semibold text-blue-600" },
                            diagramModels.length
                        ),
                        React.createElement(
                            "div",
                            { className: "text-gray-500" },
                            "Models"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "text-center" },
                        React.createElement(
                            "div",
                            { className: "font-semibold text-green-600" },
                            relationships.length
                        ),
                        React.createElement(
                            "div",
                            { className: "text-gray-500" },
                            "Relations"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "text-center" },
                        React.createElement(
                            "div",
                            { className: "font-semibold text-purple-600" },
                            model.fields.length
                        ),
                        React.createElement(
                            "div",
                            { className: "text-gray-500" },
                            "Main Fields"
                        )
                    )
                )
            ),

            // Selected Model Info
            selectedModel &&
                React.createElement(
                    "div",
                    {
                        className:
                            "px-4 sm:px-6 py-2 bg-blue-50 border-b border-blue-200",
                    },
                    React.createElement(
                        "div",
                        { className: "flex items-center justify-between" },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: `fas ${
                                    selectedModel === model.name
                                        ? "fa-star"
                                        : "fa-table"
                                } text-blue-600 mr-2`,
                            }),
                            React.createElement(
                                "span",
                                { className: "font-medium text-blue-900" },
                                selectedModel === model.name
                                    ? `Main Model: ${selectedModel}`
                                    : `Selected: ${selectedModel}`
                            ),
                            React.createElement(
                                "span",
                                { className: "ml-2 text-sm text-blue-700" },
                                `(${
                                    diagramModels.find(
                                        (m) => m.name === selectedModel
                                    )?.fields?.length || 0
                                } fields)`
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "text-xs text-blue-600" },
                            "Click and drag models • Use controls to zoom and pan"
                        )
                    )
                ),

            // Interactive ER Diagram
            React.createElement(
                "div",
                { className: "flex-1 relative overflow-hidden" },
                diagramModels.length > 0
                    ? React.createElement(
                          window.UIComponents?.ERDiagram ||
                              (() =>
                                  React.createElement(
                                      "div",
                                      {
                                          className:
                                              "flex items-center justify-center h-full text-gray-500",
                                      },
                                      React.createElement(
                                          "div",
                                          { className: "text-center" },
                                          React.createElement("i", {
                                              className:
                                                  "fas fa-exclamation-triangle text-2xl mb-2",
                                          }),
                                          React.createElement(
                                              "p",
                                              {},
                                              "ERDiagram component not loaded"
                                          ),
                                          React.createElement(
                                              "p",
                                              { className: "text-xs" },
                                              "Check that ERDiagram.js is properly loaded"
                                          )
                                      )
                                  )),
                          {
                              schema: filteredSchema,
                              onModelClick: handleModelClick,
                              onModelDoubleClick: onModelDoubleClick,
                              onRelationshipClick: handleRelationshipClick,
                              className: "border-primary",
                              height: "100%",
                              width: "100%",
                          }
                      )
                    : React.createElement(
                          "div",
                          {
                              className:
                                  "flex items-center justify-center h-full",
                          },
                          React.createElement(
                              "div",
                              { className: "text-center" },
                              React.createElement(
                                  "div",
                                  {
                                      className:
                                          "w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4",
                                  },
                                  React.createElement("i", {
                                      className:
                                          "fas fa-search text-gray-400 text-2xl",
                                  })
                              ),
                              React.createElement(
                                  "h3",
                                  {
                                      className:
                                          "text-lg font-medium text-gray-500 mb-2",
                                  },
                                  "No Related Models"
                              ),
                              React.createElement(
                                  "p",
                                  { className: "text-gray-400" },
                                  "This model has no relationships to display"
                              ),
                              React.createElement(
                                  "button",
                                  {
                                      onClick: () => setFocusMode("all"),
                                      className:
                                          "mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors",
                                  },
                                  "Show All Models"
                              )
                          )
                      )
            ),

            // Model Info Footer
            React.createElement(
                "div",
                {
                    className:
                        "px-4 sm:px-6 py-2 bg-gray-50 border-t border-gray-200",
                },
                React.createElement(
                    "div",
                    {
                        className:
                            "flex flex-wrap items-center justify-between text-xs text-gray-600",
                    },
                    React.createElement(
                        "div",
                        { className: "flex flex-wrap gap-4" },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-star mr-1 text-yellow-500",
                            }),
                            "Main model highlighted"
                        ),
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-mouse-pointer mr-1",
                            }),
                            "Click to select"
                        ),
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: "fas fa-arrows-alt mr-1",
                            }),
                            "Drag models or background"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "text-gray-500" },
                        `Focus: ${focusMode} • ${diagramModels.length} models shown`
                    )
                )
            )
        )
    )
}

// Component: CreateModelForm - Form for creating new models
function CreateModelForm({
    schema,
    showNotification,
    onSchemaUpdate,
    isMobile,
}) {
    const [modelData, setModelData] = React.useState({
        name: "",
        fields: [],
    })
    const [creating, setCreating] = React.useState(false)

    const addField = () => {
        setModelData((prev) => ({
            ...prev,
            fields: [
                ...prev.fields,
                { name: "", type: "String", required: false, unique: false },
            ],
        }))
    }

    const updateField = (index, field) => {
        setModelData((prev) => ({
            ...prev,
            fields: prev.fields.map((f, i) => (i === index ? field : f)),
        }))
    }

    const removeField = (index) => {
        setModelData((prev) => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index),
        }))
    }

    const createModel = async () => {
        if (!modelData.name.trim()) {
            showNotification("Model name is required", "error")
            return
        }

        if (modelData.fields.length === 0) {
            showNotification("At least one field is required", "error")
            return
        }

        setCreating(true)
        try {
            const response = await fetch("/ufo-studio/api/schema/model", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(modelData),
            })

            const result = await response.json()
            if (result.success) {
                showNotification("Model created successfully")
                setModelData({ name: "", fields: [] })
                if (onSchemaUpdate) onSchemaUpdate()
            } else {
                throw new Error(result.message || "Failed to create model")
            }
        } catch (error) {
            showNotification(
                "Failed to create model: " + error.message,
                "error"
            )
        } finally {
            setCreating(false)
        }
    }

    // Use global getAuthHeaders function

    const fieldTypes = [
        "String",
        "Int",
        "Float",
        "Boolean",
        "DateTime",
        "Json",
        "String[]",
        "Int[]",
    ]

    // Add model names for relations
    const relationTypes = schema?.parsed?.models?.map((m) => m.name) || []
    const allFieldTypes = [...fieldTypes, ...relationTypes]

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full" },
        React.createElement(
            "div",
            { className: "max-w-2xl mx-auto" },
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                },
                React.createElement(
                    "div",
                    { className: "mb-6" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Create New Model"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        "Define a new model for your database schema"
                    )
                ),

                React.createElement(
                    "div",
                    { className: "space-y-6" },
                    // Model Name
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Model Name *"
                        ),
                        React.createElement("input", {
                            type: "text",
                            value: modelData.name,
                            onChange: (e) =>
                                setModelData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                })),
                            placeholder: "e.g., User, Post, Product",
                            className:
                                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                        })
                    ),

                    // Fields
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "div",
                            {
                                className:
                                    "flex items-center justify-between mb-3",
                            },
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700",
                                },
                                "Fields"
                            ),
                            React.createElement(
                                "button",
                                {
                                    onClick: addField,
                                    className:
                                        "px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm",
                                },
                                React.createElement("i", {
                                    className: "fas fa-plus mr-1",
                                }),
                                "Add Field"
                            )
                        ),

                        React.createElement(
                            "div",
                            { className: "space-y-3" },
                            ...modelData.fields.map((field, index) =>
                                React.createElement(
                                    "div",
                                    {
                                        key: index,
                                        className:
                                            "flex items-center space-x-3 p-3 border border-gray-200 rounded-lg",
                                    },
                                    React.createElement("input", {
                                        type: "text",
                                        value: field.name,
                                        onChange: (e) =>
                                            updateField(index, {
                                                ...field,
                                                name: e.target.value,
                                            }),
                                        placeholder: "Field name",
                                        className:
                                            "flex-1 px-3 py-2 border border-gray-300 rounded text-sm",
                                    }),
                                    React.createElement(
                                        "select",
                                        {
                                            value: field.type,
                                            onChange: (e) =>
                                                updateField(index, {
                                                    ...field,
                                                    type: e.target.value,
                                                }),
                                            className:
                                                "px-3 py-2 border border-gray-300 rounded text-sm",
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
                                        relationTypes.length > 0 &&
                                            React.createElement(
                                                "optgroup",
                                                { label: "Relations" },
                                                ...relationTypes.map((type) =>
                                                    React.createElement(
                                                        "option",
                                                        {
                                                            key: type,
                                                            value: type,
                                                        },
                                                        type
                                                    )
                                                )
                                            )
                                    ),
                                    React.createElement(
                                        "label",
                                        {
                                            className:
                                                "flex items-center text-sm",
                                        },
                                        React.createElement("input", {
                                            type: "checkbox",
                                            checked: field.required,
                                            onChange: (e) =>
                                                updateField(index, {
                                                    ...field,
                                                    required: e.target.checked,
                                                }),
                                            className: "mr-1",
                                        }),
                                        "Required"
                                    ),
                                    React.createElement(
                                        "button",
                                        {
                                            onClick: () => removeField(index),
                                            className:
                                                "text-red-600 hover:text-red-800 p-1",
                                        },
                                        React.createElement("i", {
                                            className: "fas fa-trash",
                                        })
                                    )
                                )
                            )
                        ),

                        modelData.fields.length === 0 &&
                            React.createElement(
                                "div",
                                { className: "text-center py-8 text-gray-500" },
                                React.createElement("i", {
                                    className:
                                        "fas fa-plus-circle text-3xl mb-2",
                                }),
                                React.createElement(
                                    "p",
                                    {},
                                    'No fields added yet. Click "Add Field" to get started.'
                                )
                            )
                    ),

                    // Actions
                    React.createElement(
                        "div",
                        { className: "flex space-x-3 pt-4" },
                        React.createElement(
                            "button",
                            {
                                onClick: () =>
                                    setModelData({ name: "", fields: [] }),
                                className:
                                    "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
                            },
                            "Reset"
                        ),
                        React.createElement(
                            "button",
                            {
                                onClick: createModel,
                                disabled:
                                    creating ||
                                    !modelData.name.trim() ||
                                    modelData.fields.length === 0,
                                className:
                                    "flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50",
                            },
                            creating
                                ? [
                                      React.createElement("i", {
                                          key: "icon",
                                          className:
                                              "fas fa-spinner fa-spin mr-2",
                                      }),
                                      "Creating...",
                                  ]
                                : [
                                      React.createElement("i", {
                                          key: "icon",
                                          className: "fas fa-plus mr-2",
                                      }),
                                      "Create Model",
                                  ]
                        )
                    )
                )
            )
        )
    )
}

// Component: CreateEnumForm - Form for creating new enums
function CreateEnumForm({
    schema,
    showNotification,
    onSchemaUpdate,
    isMobile,
}) {
    const [enumData, setEnumData] = React.useState({
        name: "",
        values: [""],
    })
    const [creating, setCreating] = React.useState(false)

    const addValue = () => {
        setEnumData((prev) => ({
            ...prev,
            values: [...prev.values, ""],
        }))
    }

    const updateValue = (index, value) => {
        setEnumData((prev) => ({
            ...prev,
            values: prev.values.map((v, i) => (i === index ? value : v)),
        }))
    }

    const removeValue = (index) => {
        if (enumData.values.length > 1) {
            setEnumData((prev) => ({
                ...prev,
                values: prev.values.filter((_, i) => i !== index),
            }))
        }
    }

    const createEnum = async () => {
        if (!enumData.name.trim()) {
            showNotification("Enum name is required", "error")
            return
        }

        // Filter out empty values
        const validValues = enumData.values.filter((v) => v.trim() !== "")
        if (validValues.length === 0) {
            showNotification("At least one enum value is required", "error")
            return
        }

        setCreating(true)
        try {
            const response = await fetch("/ufo-studio/api/schema/enum", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    enumName: enumData.name,
                    values: validValues,
                }),
            })

            const result = await response.json()
            if (result.success) {
                showNotification("Enum created successfully")
                setEnumData({ name: "", values: [""] })
                if (onSchemaUpdate) onSchemaUpdate()
            } else {
                throw new Error(result.message || "Failed to create enum")
            }
        } catch (error) {
            showNotification("Failed to create enum: " + error.message, "error")
        } finally {
            setCreating(false)
        }
    }

    // Use global getAuthHeaders function

    return React.createElement(
        "div",
        { className: "p-4 sm:p-6 h-full" },
        React.createElement(
            "div",
            { className: "max-w-2xl mx-auto" },
            React.createElement(
                "div",
                {
                    className:
                        "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
                },
                React.createElement(
                    "div",
                    { className: "mb-6" },
                    React.createElement(
                        "h3",
                        { className: "text-lg font-medium text-gray-900" },
                        "Create New Enum"
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-gray-500 mt-1" },
                        "Define a new enumeration for your database schema"
                    )
                ),

                React.createElement(
                    "div",
                    { className: "space-y-6" },
                    // Enum Name
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "label",
                            {
                                className:
                                    "block text-sm font-medium text-gray-700 mb-1",
                            },
                            "Enum Name *"
                        ),
                        React.createElement("input", {
                            type: "text",
                            value: enumData.name,
                            onChange: (e) =>
                                setEnumData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                })),
                            placeholder: "e.g., Role, Status, Priority",
                            className:
                                "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm",
                        })
                    ),

                    // Values
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "div",
                            {
                                className:
                                    "flex items-center justify-between mb-3",
                            },
                            React.createElement(
                                "label",
                                {
                                    className:
                                        "block text-sm font-medium text-gray-700",
                                },
                                "Enum Values *"
                            ),
                            React.createElement(
                                "button",
                                {
                                    onClick: addValue,
                                    className:
                                        "px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm",
                                },
                                React.createElement("i", {
                                    className: "fas fa-plus mr-1",
                                }),
                                "Add Value"
                            )
                        ),

                        React.createElement(
                            "div",
                            { className: "space-y-3" },
                            ...enumData.values.map((value, index) =>
                                React.createElement(
                                    "div",
                                    {
                                        key: index,
                                        className:
                                            "flex items-center space-x-3 p-3 border border-gray-200 rounded-lg",
                                    },
                                    React.createElement(
                                        "div",
                                        {
                                            className:
                                                "flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center",
                                        },
                                        React.createElement(
                                            "span",
                                            {
                                                className:
                                                    "text-sm font-medium text-purple-600",
                                            },
                                            index + 1
                                        )
                                    ),
                                    React.createElement("input", {
                                        type: "text",
                                        value: value,
                                        onChange: (e) =>
                                            updateValue(index, e.target.value),
                                        placeholder: "Enter enum value",
                                        className:
                                            "flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                                    }),
                                    enumData.values.length > 1 &&
                                        React.createElement(
                                            "button",
                                            {
                                                onClick: () =>
                                                    removeValue(index),
                                                className:
                                                    "text-red-600 hover:text-red-800 p-1",
                                            },
                                            React.createElement("i", {
                                                className: "fas fa-trash",
                                            })
                                        )
                                )
                            )
                        ),

                        enumData.values.length === 0 &&
                            React.createElement(
                                "div",
                                { className: "text-center py-8 text-gray-500" },
                                React.createElement("i", {
                                    className:
                                        "fas fa-plus-circle text-3xl mb-2",
                                }),
                                React.createElement(
                                    "p",
                                    {},
                                    'No values added yet. Click "Add Value" to get started.'
                                )
                            )
                    ),

                    // Actions
                    React.createElement(
                        "div",
                        { className: "flex space-x-3 pt-4" },
                        React.createElement(
                            "button",
                            {
                                onClick: () =>
                                    setEnumData({ name: "", values: [""] }),
                                className:
                                    "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors",
                            },
                            "Reset"
                        ),
                        React.createElement(
                            "button",
                            {
                                onClick: createEnum,
                                disabled:
                                    creating ||
                                    !enumData.name.trim() ||
                                    enumData.values.filter((v) => v.trim())
                                        .length === 0,
                                className:
                                    "flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50",
                            },
                            creating
                                ? [
                                      React.createElement("i", {
                                          key: "icon",
                                          className:
                                              "fas fa-spinner fa-spin mr-2",
                                      }),
                                      "Creating...",
                                  ]
                                : [
                                      React.createElement("i", {
                                          key: "icon",
                                          className: "fas fa-plus mr-2",
                                      }),
                                      "Create Enum",
                                  ]
                        )
                    )
                )
            )
        )
    )
}

// Utility Functions
function getFieldType(field, schema) {
    const type = field.type

    // Check for explicit @relation first
    if (type.includes("@relation")) {
        return "relation"
    }

    // Extract base type (remove [], ?, and other modifiers)
    const baseType = type.split(" ")[0].replace("[]", "").replace("?", "")
    const isArray = type.includes("[]")

    // Get model names and enum names for detection (case-sensitive)
    const modelNames = schema?.parsed?.models?.map((m) => m.name) || []
    const enumNames = schema?.parsed?.enums?.map((e) => e.name) || []

    // Check if it's an enum field
    if (enumNames.includes(baseType)) {
        return isArray ? "enumarray" : "enum"
    }

    // Check if it's a model relation (references another model)
    if (modelNames.includes(baseType)) {
        return "relation"
    }

    // Check for arrays of basic types
    if (isArray) {
        const lowerBaseType = baseType.toLowerCase()
        if (lowerBaseType === "string") return "stringarray"
        if (lowerBaseType === "int") return "intarray"
        return "array"
    }

    // Check for basic types
    const lowerBaseType = baseType.toLowerCase()
    if (lowerBaseType === "string") return "string"
    if (lowerBaseType === "int") return "int"
    if (lowerBaseType === "float" || lowerBaseType === "decimal") return "float"
    if (lowerBaseType === "boolean") return "boolean"
    if (lowerBaseType === "datetime") return "datetime"
    if (lowerBaseType === "json") return "json"

    return "string"
}

function isRequired(field) {
    return !field.type.includes("?")
}

function isUnique(field) {
    return field.type.includes("@unique")
}

function isPrimaryKey(field) {
    return field.type.includes("@id")
}

// getAuthHeaders is now globally available from index.html

// Export content components
if (typeof window !== "undefined") {
    window.ContentComponents = {
        ...window.ContentComponents,
        ModelStructure,
        ModelData,
        ModelRelationships,
        SchemaOverview,
        CreateRecordButton,
        EnumEditor,
        ModelERDiagram,
        CreateModelForm,
        CreateEnumForm,
        EditRecordButton,
        getFieldType,
        isRequired,
        isUnique,
        isPrimaryKey,
    }
}
