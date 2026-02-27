/* global React, window, getAuthHeaders, useState, useEffect, useMemo */
// Base Components for Admin Panel

// Component: ModelItem
function ModelItem({
    model,
    isSelected,
    onClick,
    onDragStart,
    onDragEnd,
    isDragging,
}) {
    const fieldCount = model.fields.length
    const relationCount = model.fields.filter((f) =>
        f.type.includes("@relation")
    ).length

    const handleClick = () => {
        setTimeout(() => {
            onClick()
        }, 0)
    }

    return React.createElement(
        "div",
        {
            onClick: handleClick,
            draggable: true,
            onDragStart: onDragStart,
            onDragEnd: onDragEnd,
            className: `p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                    ? "bg-blue-50 border-l-4 border-blue-500 shadow-sm"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
            } ${isDragging ? "opacity-50" : ""}`,
        },
        React.createElement(
            "div",
            { className: "flex items-center justify-between" },
            React.createElement(
                "div",
                { className: "flex items-center min-w-0 flex-1" },
                React.createElement("i", {
                    className: "fas fa-table text-blue-500 mr-2 flex-shrink-0",
                }),
                React.createElement(
                    "div",
                    { className: "min-w-0 flex-1" },
                    React.createElement(
                        "div",
                        { className: "font-medium text-gray-900 truncate" },
                        model.name
                    ),
                    React.createElement(
                        "div",
                        { className: "flex items-center space-x-3 mt-1" },
                        React.createElement(
                            "span",
                            { className: "text-xs text-gray-500" },
                            React.createElement("i", {
                                className: "fas fa-columns mr-1",
                            }),
                            `${fieldCount} fields`
                        ),
                        relationCount > 0 &&
                            React.createElement(
                                "span",
                                { className: "text-xs text-gray-500" },
                                React.createElement("i", {
                                    className: "fas fa-link mr-1",
                                }),
                                `${relationCount} relations`
                            )
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "flex-shrink-0 ml-2" },
                React.createElement("div", {
                    className: "w-2 h-2 bg-green-400 rounded-full",
                })
            )
        )
    )
}

// Component: EnumItem
function EnumItem({ enumItem, isSelected, onClick }) {
    const handleClick = () => {
        setTimeout(() => {
            onClick()
        }, 0)
    }

    return React.createElement(
        "div",
        {
            onClick: handleClick,
            className: `p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                    ? "bg-purple-50 border-l-4 border-purple-500 shadow-sm"
                    : "hover:bg-gray-50 border-l-4 border-transparent"
            }`,
        },
        React.createElement(
            "div",
            { className: "flex items-center justify-between" },
            React.createElement(
                "div",
                { className: "flex items-center min-w-0 flex-1" },
                React.createElement("i", {
                    className: "fas fa-list text-purple-500 mr-2 flex-shrink-0",
                }),
                React.createElement(
                    "div",
                    { className: "min-w-0 flex-1" },
                    React.createElement(
                        "div",
                        { className: "font-medium text-gray-900 truncate" },
                        enumItem.name
                    ),
                    React.createElement(
                        "div",
                        { className: "text-xs text-gray-500 mt-1" },
                        React.createElement("i", {
                            className: "fas fa-tags mr-1",
                        }),
                        `${enumItem.values.length} values`
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "flex-shrink-0 ml-2" },
                React.createElement("div", {
                    className: "w-2 h-2 bg-purple-400 rounded-full",
                })
            )
        )
    )
}

// Component: FolderGroup
function FolderGroup({
    folderName,
    models,
    isExpanded,
    onToggle,
    selectedItem,
    onModelClick,
    onDragStart,
    onDragEnd,
    isDragging,
    onDrop,
    router,
    isMobile,
    setSidebarOpen,
}) {
    const folderDisplayName =
        folderName === "models"
            ? "General"
            : folderName.charAt(0).toUpperCase() +
              folderName
                  .slice(1)
                  .replace(/([A-Z])/g, " $1")
                  .trim()

    return React.createElement(
        "div",
        { className: "mb-4" },
        React.createElement(
            "button",
            {
                onClick: () => onToggle(folderName),
                className:
                    "w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors",
            },
            React.createElement(
                "div",
                { className: "flex items-center" },
                React.createElement("i", {
                    className: `fas ${
                        isExpanded ? "fa-chevron-down" : "fa-chevron-right"
                    } text-gray-400 text-xs mr-2`,
                }),
                React.createElement("i", {
                    className: "fas fa-folder text-yellow-500 mr-2",
                }),
                React.createElement(
                    "span",
                    { className: "font-medium text-gray-900" },
                    folderDisplayName
                ),
                React.createElement(
                    "span",
                    {
                        className:
                            "ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full",
                    },
                    models.length
                )
            )
        ),

        isExpanded &&
            React.createElement(
                "div",
                {
                    className: "mt-2 ml-6 space-y-1",
                    onDragOver: (e) => {
                        e.preventDefault()
                        e.currentTarget.style.backgroundColor = "#f3f4f6"
                    },
                    onDragLeave: (e) => {
                        e.currentTarget.style.backgroundColor = "transparent"
                    },
                    onDrop: (e) => {
                        e.preventDefault()
                        e.currentTarget.style.backgroundColor = "transparent"
                        onDrop(e, folderName)
                    },
                },
                ...models.map((model) =>
                    React.createElement(ModelItem, {
                        key: model.name,
                        model: model,
                        isSelected:
                            selectedItem?.type === "model" &&
                            selectedItem?.name === model.name,
                        isDragging: isDragging === model.name,
                        onClick: () => {
                            if (router) {
                                router.navigateToModel(model.name)
                            } else {
                                onModelClick({
                                    type: "model",
                                    name: model.name,
                                })
                            }
                            if (isMobile) setSidebarOpen(false)
                        },
                        onDragStart: (e) => onDragStart(e, model),
                        onDragEnd: onDragEnd,
                    })
                )
            )
    )
}

// Component: Enhanced Sidebar (Simplified)
function EnhancedSidebar({
    schema,
    selectedItem,
    setSelectedItem,
    searchTerm,
    setSearchTerm,
    filteredModels,
    filteredEnums,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    onRefresh,
    darkMode,
    setDarkMode,
    router,
}) {
    const [expandedSections, setExpandedSections] = useState({
        models: true,
        enums: true,
    })
    const [expandedFolders, setExpandedFolders] = useState({})
    const [modelFiles, setModelFiles] = useState({})
    const [isLoadingFolders, setIsLoadingFolders] = useState(true)

    // Fetch model files
    useEffect(() => {
        const fetchModelData = async () => {
            try {
                setIsLoadingFolders(true)
                const response = await fetch("/ufo-studio/api/schema/models", {
                    headers: getAuthHeaders(),
                })

                if (response.ok) {
                    const data = await response.json()
                    setModelFiles(data.data)

                    // Initialize expanded state for all folders
                    const folders = new Set()
                    Object.values(data.data).forEach((filePath) => {
                        const pathParts = filePath.split("/")
                        const schemaIndex = pathParts.indexOf("schema")
                        if (
                            schemaIndex !== -1 &&
                            pathParts.length > schemaIndex + 2
                        ) {
                            if (
                                pathParts[schemaIndex + 1] === "models" &&
                                pathParts.length > schemaIndex + 2
                            ) {
                                folders.add(pathParts[schemaIndex + 2])
                            }
                        }
                    })

                    const initialExpanded = {}
                    folders.forEach((folder) => {
                        initialExpanded[folder] = true
                    })
                    initialExpanded["models"] = true
                    setExpandedFolders(initialExpanded)
                }
            } catch (error) {
                console.error("Error fetching model data:", error)
            } finally {
                setIsLoadingFolders(false)
            }
        }

        fetchModelData()
    }, [])

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const toggleFolder = (folderName) => {
        setExpandedFolders((prev) => ({
            ...prev,
            [folderName]: !prev[folderName],
        }))
    }

    // Group models by folder - only group models inside actual subfolders
    const groupedModels = useMemo(() => {
        const groups = {}

        filteredModels.forEach((model) => {
            const filePath = modelFiles[model.name]
            if (filePath) {
                // Extract folder from path: prisma/schema/models/airtable/ModelName.prisma -> airtable
                const pathParts = filePath.split("/")
                const schemaIndex = pathParts.indexOf("schema")

                // Check if model is inside a subfolder within models/
                if (
                    schemaIndex !== -1 &&
                    pathParts[schemaIndex + 1] === "models" &&
                    pathParts.length > schemaIndex + 3
                ) {
                    // Model is inside a subfolder (e.g., prisma/schema/models/airtable/ModelName.prisma)
                    const folder = pathParts[schemaIndex + 2] // Get the subfolder name
                    if (!groups[folder]) {
                        groups[folder] = []
                    }
                    groups[folder].push(model)
                } else {
                    // Model is directly in models/ or doesn't have a folder - add to "models" group
                    if (!groups["models"]) {
                        groups["models"] = []
                    }
                    groups["models"].push(model)
                }
            } else {
                // Default to 'models' folder if no file path found
                if (!groups["models"]) {
                    groups["models"] = []
                }
                groups["models"].push(model)
            }
        })

        return groups
    }, [filteredModels, modelFiles])

    const handleDragStart = (e, model) => {
        e.dataTransfer.setData("text/plain", model.name)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragEnd = () => {
        // Handle drag end
    }

    const handleDrop = async (e, targetFolder) => {
        e.preventDefault()
        const modelName = e.dataTransfer.getData("text/plain")

        if (!modelName || targetFolder === "models") return

        try {
            const response = await fetch(
                `/ufo-studio/api/schema/model/${modelName}/move`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({ category: targetFolder }),
                }
            )

            if (response.ok) {
                onRefresh()
            }
        } catch (error) {
            console.error("Error moving model:", error)
        }
    }

    const sidebarClasses = isMobile
        ? `fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`
        : "w-80 bg-white border-r border-gray-200 flex-shrink-0"

    return React.createElement(
        "div",
        { className: sidebarClasses },
        React.createElement(
            "div",
            { className: "flex flex-col h-full" },
            // Header
            React.createElement(
                "div",
                {
                    className:
                        "flex items-center justify-between p-6 border-b border-gray-200",
                },
                React.createElement(
                    "div",
                    { className: "flex items-center" },
                    React.createElement(
                        "div",
                        {
                            className:
                                "w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3",
                        },
                        React.createElement("i", {
                            className: "fas fa-database text-white text-sm",
                        })
                    ),
                    React.createElement(
                        "div",
                        {},
                        React.createElement(
                            "h1",
                            {
                                className:
                                    "text-lg font-semibold text-gray-900",
                            },
                            "Database Manager"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-xs text-gray-500" },
                            "Prisma Admin Panel"
                        )
                    )
                ),

                React.createElement(
                    "div",
                    { className: "flex items-center space-x-2" },
                    React.createElement(
                        "button",
                        {
                            onClick: () => setDarkMode(!darkMode),
                            className:
                                "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
                            title: "Toggle theme",
                        },
                        React.createElement("i", {
                            className: `fas ${darkMode ? "fa-sun" : "fa-moon"}`,
                        })
                    ),

                    React.createElement(
                        "button",
                        {
                            onClick: onRefresh,
                            className:
                                "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
                            title: "Refresh schema",
                        },
                        React.createElement("i", {
                            className: "fas fa-sync-alt",
                        })
                    ),

                    isMobile &&
                        React.createElement(
                            "button",
                            {
                                onClick: () => setSidebarOpen(false),
                                className:
                                    "p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
                            },
                            React.createElement("i", {
                                className: "fas fa-times",
                            })
                        )
                )
            ),

            // Search
            React.createElement(
                "div",
                { className: "p-4 border-b border-gray-200" },
                React.createElement(
                    "div",
                    { className: "relative" },
                    React.createElement("i", {
                        className:
                            "fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm",
                    }),
                    React.createElement("input", {
                        type: "text",
                        placeholder: "Search models and enums...",
                        value: searchTerm,
                        onChange: (e) => setSearchTerm(e.target.value),
                        className:
                            "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
                    }),
                    searchTerm &&
                        React.createElement(
                            "button",
                            {
                                onClick: () => setSearchTerm(""),
                                className:
                                    "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600",
                            },
                            React.createElement("i", {
                                className: "fas fa-times text-xs",
                            })
                        )
                )
            ),

            // Navigation
            React.createElement(
                "div",
                { className: "flex-1 overflow-y-auto custom-scrollbar p-4" },
                // Statistics
                React.createElement(
                    "div",
                    { className: "mb-6" },
                    React.createElement(
                        "div",
                        { className: "grid grid-cols-2 gap-3" },
                        React.createElement(
                            "div",
                            { className: "bg-blue-50 p-3 rounded-lg" },
                            React.createElement(
                                "div",
                                {
                                    className:
                                        "text-2xl font-bold text-blue-600",
                                },
                                filteredModels.length
                            ),
                            React.createElement(
                                "div",
                                {
                                    className:
                                        "text-xs text-blue-600 font-medium",
                                },
                                "Models"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "bg-purple-50 p-3 rounded-lg" },
                            React.createElement(
                                "div",
                                {
                                    className:
                                        "text-2xl font-bold text-purple-600",
                                },
                                filteredEnums.length
                            ),
                            React.createElement(
                                "div",
                                {
                                    className:
                                        "text-xs text-purple-600 font-medium",
                                },
                                "Enums"
                            )
                        )
                    )
                ),

                // Models Section
                React.createElement(
                    "div",
                    { className: "mb-6" },
                    React.createElement(
                        "button",
                        {
                            onClick: () => toggleSection("models"),
                            className:
                                "w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors",
                        },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: `fas ${
                                    expandedSections.models
                                        ? "fa-chevron-down"
                                        : "fa-chevron-right"
                                } text-gray-400 text-xs mr-2`,
                            }),
                            React.createElement("i", {
                                className: "fas fa-table text-blue-500 mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "font-medium text-gray-900" },
                                "Models"
                            ),
                            React.createElement(
                                "span",
                                {
                                    className:
                                        "ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full",
                                },
                                filteredModels.length
                            )
                        )
                    ),

                    expandedSections.models &&
                        React.createElement(
                            "div",
                            { className: "space-y-2" },
                            isLoadingFolders
                                ? React.createElement(
                                      "div",
                                      {
                                          className:
                                              "text-sm text-gray-500 py-2",
                                      },
                                      "Loading folders..."
                                  )
                                : Object.entries(groupedModels).map(
                                      ([folderName, models]) => {
                                          // If it's the "models" group, render as regular items without folder grouping
                                          if (folderName === "models") {
                                              return React.createElement(
                                                  "div",
                                                  {
                                                      key: folderName,
                                                      className: "space-y-1",
                                                  },
                                                  ...models.map((model) =>
                                                      React.createElement(
                                                          ModelItem,
                                                          {
                                                              key: model.name,
                                                              model: model,
                                                              isSelected:
                                                                  selectedItem?.type ===
                                                                      "model" &&
                                                                  selectedItem?.name ===
                                                                      model.name,
                                                              onClick: () => {
                                                                  if (router) {
                                                                      router.navigateToModel(
                                                                          model.name
                                                                      )
                                                                  } else {
                                                                      setSelectedItem(
                                                                          {
                                                                              type: "model",
                                                                              name: model.name,
                                                                          }
                                                                      )
                                                                  }
                                                                  if (isMobile)
                                                                      setSidebarOpen(
                                                                          false
                                                                      )
                                                              },
                                                              onDragStart: (
                                                                  e
                                                              ) =>
                                                                  handleDragStart(
                                                                      e,
                                                                      model
                                                                  ),
                                                              onDragEnd:
                                                                  handleDragEnd,
                                                              isDragging: null,
                                                          }
                                                      )
                                                  )
                                              )
                                          }

                                          // Otherwise, render as folder group
                                          return React.createElement(
                                              FolderGroup,
                                              {
                                                  key: folderName,
                                                  folderName: folderName,
                                                  models: models,
                                                  isExpanded:
                                                      expandedFolders[
                                                          folderName
                                                      ] || false,
                                                  onToggle: toggleFolder,
                                                  selectedItem: selectedItem,
                                                  onModelClick: setSelectedItem,
                                                  onDragStart: handleDragStart,
                                                  onDragEnd: handleDragEnd,
                                                  isDragging: null,
                                                  onDrop: handleDrop,
                                                  router: router,
                                                  isMobile: isMobile,
                                                  setSidebarOpen:
                                                      setSidebarOpen,
                                              }
                                          )
                                      }
                                  ),
                            filteredModels.length === 0 &&
                                searchTerm &&
                                React.createElement(
                                    "div",
                                    {
                                        className:
                                            "text-sm text-gray-500 py-2 px-3",
                                    },
                                    `No models found for "${searchTerm}"`
                                )
                        )
                ),

                // Enums Section
                React.createElement(
                    "div",
                    { className: "mb-6" },
                    React.createElement(
                        "button",
                        {
                            onClick: () => toggleSection("enums"),
                            className:
                                "w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors",
                        },
                        React.createElement(
                            "div",
                            { className: "flex items-center" },
                            React.createElement("i", {
                                className: `fas ${
                                    expandedSections.enums
                                        ? "fa-chevron-down"
                                        : "fa-chevron-right"
                                } text-gray-400 text-xs mr-2`,
                            }),
                            React.createElement("i", {
                                className: "fas fa-list text-purple-500 mr-2",
                            }),
                            React.createElement(
                                "span",
                                { className: "font-medium text-gray-900" },
                                "Enums"
                            ),
                            React.createElement(
                                "span",
                                {
                                    className:
                                        "ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full",
                                },
                                filteredEnums.length
                            )
                        )
                    ),

                    expandedSections.enums &&
                        React.createElement(
                            "div",
                            { className: "mt-2 ml-6 space-y-1" },
                            ...filteredEnums.map((enumItem) =>
                                React.createElement(EnumItem, {
                                    key: enumItem.name,
                                    enumItem: enumItem,
                                    isSelected:
                                        selectedItem?.type === "enum" &&
                                        selectedItem?.name === enumItem.name,
                                    onClick: () => {
                                        if (router) {
                                            router.navigateToEnum(enumItem.name)
                                        } else {
                                            setSelectedItem({
                                                type: "enum",
                                                name: enumItem.name,
                                            })
                                        }
                                        if (isMobile) setSidebarOpen(false)
                                    },
                                })
                            ),
                            filteredEnums.length === 0 &&
                                searchTerm &&
                                React.createElement(
                                    "div",
                                    {
                                        className:
                                            "text-sm text-gray-500 py-2 px-3",
                                    },
                                    `No enums found for "${searchTerm}"`
                                )
                        )
                )
            ),

            // Footer Actions
            React.createElement(
                "div",
                { className: "border-t border-gray-200 p-4 space-y-2" },
                React.createElement(
                    "button",
                    {
                        onClick: () => {
                            if (router) {
                                router.navigateToSchema("editor")
                            } else {
                                setSelectedItem({
                                    type: "schema",
                                    name: "schema",
                                })
                            }
                            if (isMobile) setSidebarOpen(false)
                        },
                        className:
                            "w-full flex items-center justify-center p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors",
                    },
                    React.createElement("i", { className: "fas fa-code mr-2" }),
                    React.createElement(
                        "span",
                        { className: "font-medium" },
                        "Schema Editor"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "grid grid-cols-1 gap-2" },
                    React.createElement(
                        "button",
                        {
                            onClick: () => {
                                if (router) {
                                    router.navigate({ type: "create-model" })
                                } else {
                                    setSelectedItem({
                                        type: "create-model",
                                        name: "create-model",
                                    })
                                }
                                if (isMobile) setSidebarOpen(false)
                            },
                            className:
                                "w-full flex items-center justify-center p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors",
                        },
                        React.createElement("i", {
                            className: "fas fa-table mr-2",
                        }),
                        React.createElement(
                            "span",
                            { className: "font-medium" },
                            "Create Model"
                        )
                    ),
                    React.createElement(
                        "button",
                        {
                            onClick: () => {
                                if (router) {
                                    router.navigate({ type: "create-enum" })
                                } else {
                                    setSelectedItem({
                                        type: "create-enum",
                                        name: "create-enum",
                                    })
                                }
                                if (isMobile) setSidebarOpen(false)
                            },
                            className:
                                "w-full flex items-center justify-center p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors",
                        },
                        React.createElement("i", {
                            className: "fas fa-list mr-2",
                        }),
                        React.createElement(
                            "span",
                            { className: "font-medium" },
                            "Create Enum"
                        )
                    )
                )
            )
        )
    )
}

// Export components to global scope
if (typeof window !== "undefined") {
    window.Components = {
        Sidebar: EnhancedSidebar,
        ModelItem,
        EnumItem,
        FolderGroup,
    }
}
