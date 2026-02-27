// Main Admin Panel Application
const { useState, useEffect, useCallback, useMemo, useRef } = React

// Simple Router for Admin Panel
const AdminRouter = {
    // Parse current URL to extract route information
    parseUrl: () => {
        const pathname = window.location.pathname
        const basePath = "/ufo-studio"

        // Remove base path
        const relativePath = pathname.replace(basePath, "") || "/"

        // Parse routes
        const segments = relativePath.split("/").filter(Boolean)

        if (segments.length === 0) {
            return { type: "home" }
        }

        // Schema routes
        if (segments[0] === "schema") {
            const tab = segments[1] || "editor"
            return {
                type: "schema",
                tab: ["editor", "migrations", "overview"].includes(tab)
                    ? tab
                    : "editor",
            }
        }

        // Model routes: /model/{modelName}/{tab}
        if (segments[0] === "model" && segments[1]) {
            const modelName = segments[1]
            const tab = segments[2] || "structure"
            return {
                type: "model",
                name: modelName,
                tab: ["structure", "data", "relationships", "diagram"].includes(
                    tab
                )
                    ? tab
                    : "structure",
            }
        }

        // Enum routes: /enum/{enumName}
        if (segments[0] === "enum" && segments[1]) {
            return {
                type: "enum",
                name: segments[1],
                tab: "values",
            }
        }

        // Create routes
        if (segments[0] === "create") {
            if (segments[1] === "model") {
                return { type: "create-model", tab: "form" }
            }
            if (segments[1] === "enum") {
                return { type: "create-enum", tab: "form" }
            }
        }

        return { type: "home" }
    },

    // Navigate to a specific route
    navigate: (route, replace = false) => {
        const basePath = "/ufo-studio"
        let url = basePath

        if (route.type === "home") {
            url = basePath
        } else if (route.type === "schema") {
            url = `${basePath}/schema/${route.tab || "editor"}`
        } else if (route.type === "model") {
            url = `${basePath}/model/${route.name}/${route.tab || "structure"}`
        } else if (route.type === "enum") {
            url = `${basePath}/enum/${route.name}`
        } else if (route.type === "create-model") {
            url = `${basePath}/create/model`
        } else if (route.type === "create-enum") {
            url = `${basePath}/create/enum`
        }

        // Only update URL and dispatch event if it's actually changing
        const currentUrl = window.location.pathname
        if (currentUrl !== url) {
            if (replace) {
                window.history.replaceState({}, "", url)
            } else {
                window.history.pushState({}, "", url)
            }

            // Dispatch custom event to notify AdminPanel of programmatic navigation
            window.dispatchEvent(
                new CustomEvent("adminRouteChange", {
                    detail: { route, url, replace },
                })
            )
        }
    },

    // Navigate to model with specific tab
    navigateToModel: (modelName, tab = "structure") => {
        AdminRouter.navigate({ type: "model", name: modelName, tab })
    },

    // Navigate to enum
    navigateToEnum: (enumName) => {
        AdminRouter.navigate({ type: "enum", name: enumName })
    },

    // Navigate to schema with specific tab
    navigateToSchema: (tab = "editor") => {
        AdminRouter.navigate({ type: "schema", tab })
    },
}

// Utility Functions
const getAuthHeaders = () => {
    const token = localStorage.getItem("ufoStudioToken")
    return token ? { Authorization: `Bearer ${token}` } : {}
}

const useNotification = () => {
    const [notification, setNotification] = useState(null)

    const showNotification = useCallback((message, type = "success") => {
        const newNotification = {
            id: Date.now(),
            message,
            type,
        }
        setNotification(newNotification)

        setTimeout(() => {
            setNotification(null)
        }, 4000)
    }, [])

    const hideNotification = useCallback(() => {
        setNotification(null)
    }, [])

    return {
        notification,
        showNotification,
        hideNotification,
    }
}

const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [isTablet, setIsTablet] = useState(window.innerWidth < 1024)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
            setIsTablet(window.innerWidth < 1024)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return {
        isMobile,
        isTablet,
        isDesktop: !isTablet,
    }
}

// Use utility functions from content-components.js

// Component: LoadingScreen
function LoadingScreen() {
    return React.createElement(
        "div",
        {
            className:
                "h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100",
        },
        React.createElement(
            "div",
            { className: "text-center" },
            React.createElement(
                "div",
                { className: "mb-8" },
                React.createElement(
                    "div",
                    {
                        className:
                            "w-16 h-16 mx-auto bg-blue-500 rounded-2xl flex items-center justify-center mb-4",
                    },
                    React.createElement("i", {
                        className: "fas fa-database text-white text-2xl",
                    })
                ),
                React.createElement(
                    "h1",
                    { className: "text-2xl font-bold text-gray-900 mb-2" },
                    "Database Manager"
                ),
                React.createElement(
                    "p",
                    { className: "text-gray-600" },
                    "Professional Prisma Admin Panel"
                )
            ),
            React.createElement(
                "div",
                {
                    className:
                        "flex items-center justify-center space-x-2 mb-4",
                },
                React.createElement("div", {
                    className:
                        "w-3 h-3 bg-blue-500 rounded-full animate-bounce",
                }),
                React.createElement("div", {
                    className:
                        "w-3 h-3 bg-blue-500 rounded-full animate-bounce",
                    style: { animationDelay: "0.1s" },
                }),
                React.createElement("div", {
                    className:
                        "w-3 h-3 bg-blue-500 rounded-full animate-bounce",
                    style: { animationDelay: "0.2s" },
                })
            ),
            React.createElement(
                "p",
                { className: "text-sm text-gray-500" },
                "Loading your database schema..."
            )
        )
    )
}

// Component: NotificationManager
function NotificationManager({ notification, onClose }) {
    if (!notification) return null

    const typeStyles = {
        success: "bg-green-500 border-green-600",
        error: "bg-red-500 border-red-600",
        warning: "bg-yellow-500 border-yellow-600",
        info: "bg-blue-500 border-blue-600",
    }

    const typeIcons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        warning: "fa-exclamation-triangle",
        info: "fa-info-circle",
    }

    return React.createElement(
        "div",
        { className: "fixed top-4 right-4 z-50 max-w-sm w-full px-4" },
        React.createElement(
            "div",
            {
                className: `${
                    typeStyles[notification.type]
                } text-white p-4 rounded-lg shadow-lg border-l-4 fade-in`,
            },
            React.createElement(
                "div",
                { className: "flex items-center justify-between" },
                React.createElement(
                    "div",
                    { className: "flex items-center" },
                    React.createElement("i", {
                        className: `fas ${typeIcons[notification.type]} mr-3`,
                    }),
                    React.createElement(
                        "span",
                        { className: "font-medium" },
                        notification.message
                    )
                ),
                React.createElement(
                    "button",
                    {
                        onClick: onClose,
                        className: "ml-4 hover:text-gray-200 transition-colors",
                    },
                    React.createElement("i", { className: "fas fa-times" })
                )
            )
        )
    )
}

// Component: WelcomeScreen
function WelcomeScreen({ setSidebarOpen, isMobile }) {
    const features = [
        {
            icon: "fa-table",
            title: "Visual Schema Builder",
            desc: "Point-and-click model creation and editing",
        },
        {
            icon: "fa-database",
            title: "Data Management",
            desc: "Browse, create, and edit records with ease",
        },
        {
            icon: "fa-link",
            title: "Relationship Mapping",
            desc: "Visual relationship diagrams and management",
        },
        {
            icon: "fa-cog",
            title: "Migration Tools",
            desc: "Run migrations and generate client code",
        },
    ]

    return React.createElement(
        "div",
        { className: "flex-1 flex items-center justify-center p-6" },
        React.createElement(
            "div",
            { className: "max-w-2xl mx-auto text-center" },
            // Hero Section
            React.createElement(
                "div",
                { className: "mb-12" },
                React.createElement(
                    "div",
                    {
                        className:
                            "w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg",
                    },
                    React.createElement("i", {
                        className: "fas fa-database text-white text-3xl",
                    })
                ),
                React.createElement(
                    "h1",
                    {
                        className:
                            "text-3xl sm:text-4xl font-bold text-gray-900 mb-4",
                    },
                    "Welcome to Database Manager"
                ),
                React.createElement(
                    "p",
                    { className: "text-lg text-gray-600 mb-8" },
                    "Professional Prisma admin panel with Strapi-like experience"
                ),

                isMobile &&
                    React.createElement(
                        "button",
                        {
                            onClick: () => setSidebarOpen(true),
                            className:
                                "inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg mb-8",
                        },
                        React.createElement("i", {
                            className: "fas fa-bars mr-2",
                        }),
                        "Browse Database"
                    )
            ),

            // Features Grid
            React.createElement(
                "div",
                { className: "grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12" },
                ...features.map((feature, index) =>
                    React.createElement(
                        "div",
                        {
                            key: index,
                            className:
                                "bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow",
                        },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto",
                            },
                            React.createElement("i", {
                                className: `fas ${feature.icon} text-blue-600`,
                            })
                        ),
                        React.createElement(
                            "h3",
                            { className: "font-semibold text-gray-900 mb-2" },
                            feature.title
                        ),
                        React.createElement(
                            "p",
                            { className: "text-sm text-gray-600" },
                            feature.desc
                        )
                    )
                )
            ),

            // Getting Started
            React.createElement(
                "div",
                {
                    className:
                        "bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200",
                },
                React.createElement(
                    "h3",
                    { className: "font-semibold text-gray-900 mb-2" },
                    "Getting Started"
                ),
                React.createElement(
                    "p",
                    { className: "text-sm text-gray-600 mb-4" },
                    "Select a model or enum from the sidebar to start managing your database schema and data."
                ),
                React.createElement(
                    "div",
                    { className: "flex flex-wrap gap-2 justify-center" },
                    React.createElement(
                        "span",
                        {
                            className:
                                "px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border",
                        },
                        React.createElement("i", {
                            className: "fas fa-table mr-1 text-blue-500",
                        }),
                        "Browse Models"
                    ),
                    React.createElement(
                        "span",
                        {
                            className:
                                "px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border",
                        },
                        React.createElement("i", {
                            className: "fas fa-plus mr-1 text-green-500",
                        }),
                        "Create Records"
                    ),
                    React.createElement(
                        "span",
                        {
                            className:
                                "px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border",
                        },
                        React.createElement("i", {
                            className: "fas fa-edit mr-1 text-purple-500",
                        }),
                        "Edit Schema"
                    )
                )
            )
        )
    )
}

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
                    React.createElement(
                        "button",
                        {
                            onClick: () =>
                                showNotification(
                                    "Create record functionality coming soon"
                                ),
                            className:
                                "inline-flex items-center px-2 sm:px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm",
                        },
                        React.createElement("i", {
                            className: "fas fa-plus mr-1",
                        }),
                        !isMobile &&
                            React.createElement("span", {}, "New Record")
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
        }
        return []
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

// Component: SimpleSidebar (fallback)
function SimpleSidebar({
    schema,
    selectedItem,
    setSelectedItem,
    filteredModels,
    filteredEnums,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
}) {
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
            { className: "p-4" },
            React.createElement(
                "div",
                { className: "mb-4" },
                React.createElement(
                    "h2",
                    { className: "text-lg font-semibold" },
                    "Database Manager"
                ),
                React.createElement(
                    "p",
                    { className: "text-sm text-gray-500" },
                    "Sidebar component loading..."
                )
            ),

            // Models
            React.createElement(
                "div",
                { className: "mb-4" },
                React.createElement(
                    "h3",
                    { className: "font-medium mb-2" },
                    "Models"
                ),
                React.createElement(
                    "div",
                    { className: "space-y-1" },
                    ...filteredModels.map((model) =>
                        React.createElement(
                            "div",
                            {
                                key: model.name,
                                onClick: () =>
                                    setSelectedItem({
                                        type: "model",
                                        name: model.name,
                                    }),
                                className:
                                    "p-2 hover:bg-gray-100 rounded cursor-pointer",
                            },
                            model.name
                        )
                    )
                )
            ),

            // Enums
            React.createElement(
                "div",
                { className: "mb-4" },
                React.createElement(
                    "h3",
                    { className: "font-medium mb-2" },
                    "Enums"
                ),
                React.createElement(
                    "div",
                    { className: "space-y-1" },
                    ...filteredEnums.map((enumItem) =>
                        React.createElement(
                            "div",
                            {
                                key: enumItem.name,
                                onClick: () =>
                                    setSelectedItem({
                                        type: "enum",
                                        name: enumItem.name,
                                    }),
                                className:
                                    "p-2 hover:bg-gray-100 rounded cursor-pointer",
                            },
                            enumItem.name
                        )
                    )
                )
            )
        )
    )
}

// Component: ModelStructure
function ModelStructure({
    model,
    showNotification,
    onSchemaUpdate,
    isMobile,
    schema,
}) {
    const renderFieldBadge = (field) => {
        const fieldType = window.ContentComponents?.getFieldType
            ? window.ContentComponents.getFieldType(field, schema)
            : "string"
        return React.createElement(
            "span",
            {
                className: `field-badge field-${fieldType.replace("-", "")}`,
            },
            fieldType.toUpperCase().replace("-", " ")
        )
    }

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
                        "px-6 py-4 border-b border-gray-200 flex items-center justify-between",
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
                        `${model.fields.length} columns`
                    )
                ),
                React.createElement(
                    "button",
                    {
                        onClick: () =>
                            showNotification("Edit functionality coming soon"),
                        className:
                            "px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm",
                    },
                    React.createElement("i", { className: "fas fa-edit mr-1" }),
                    "Edit Structure"
                )
            ),

            // Table
            isMobile
                ? React.createElement(
                      "div",
                      { className: "divide-y divide-gray-200" },
                      ...model.fields.map((field) =>
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
                                              window.ContentComponents
                                                  ?.isPrimaryKey
                                                  ? window.ContentComponents.isPrimaryKey(
                                                        field
                                                    )
                                                      ? "text-yellow-500"
                                                      : "text-gray-300"
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
                                  )
                              ),
                              React.createElement(
                                  "div",
                                  { className: "flex flex-wrap gap-2" },
                                  renderFieldBadge(field),
                                  window.ContentComponents?.isRequired &&
                                      window.ContentComponents.isRequired(
                                          field
                                      ) &&
                                      React.createElement(
                                          "span",
                                          {
                                              className:
                                                  "px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full",
                                          },
                                          "Required"
                                      ),
                                  window.ContentComponents?.isUnique &&
                                      window.ContentComponents.isUnique(
                                          field
                                      ) &&
                                      React.createElement(
                                          "span",
                                          {
                                              className:
                                                  "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full",
                                          },
                                          "Unique"
                                      ),
                                  window.ContentComponents?.isPrimaryKey &&
                                      window.ContentComponents.isPrimaryKey(
                                          field
                                      ) &&
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
                : React.createElement(
                      "div",
                      { className: "overflow-x-auto" },
                      React.createElement(
                          "table",
                          { className: "min-w-full divide-y divide-gray-200" },
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
                                              "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase",
                                      },
                                      "Column"
                                  ),
                                  React.createElement(
                                      "th",
                                      {
                                          className:
                                              "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase",
                                      },
                                      "Type"
                                  ),
                                  React.createElement(
                                      "th",
                                      {
                                          className:
                                              "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase",
                                      },
                                      "Constraints"
                                  )
                              )
                          ),
                          React.createElement(
                              "tbody",
                              {
                                  className:
                                      "bg-white divide-y divide-gray-200",
                              },
                              ...model.fields.map((field) =>
                                  React.createElement(
                                      "tr",
                                      { key: field.name },
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
                                                      window.ContentComponents
                                                          ?.isPrimaryKey
                                                          ? window.ContentComponents.isPrimaryKey(
                                                                field
                                                            )
                                                              ? "text-yellow-500"
                                                              : "text-gray-300"
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
                                              window.ContentComponents
                                                  ?.isRequired &&
                                                  window.ContentComponents.isRequired(
                                                      field
                                                  ) &&
                                                  React.createElement(
                                                      "span",
                                                      {
                                                          className:
                                                              "px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full",
                                                      },
                                                      "Required"
                                                  ),
                                              window.ContentComponents
                                                  ?.isUnique &&
                                                  window.ContentComponents.isUnique(
                                                      field
                                                  ) &&
                                                  React.createElement(
                                                      "span",
                                                      {
                                                          className:
                                                              "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full",
                                                      },
                                                      "Unique"
                                                  ),
                                              window.ContentComponents
                                                  ?.isPrimaryKey &&
                                                  window.ContentComponents.isPrimaryKey(
                                                      field
                                                  ) &&
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
                          )
                      )
                  )
        )
    )
}

// Content Renderer - Loads components from other files
function ContentRenderer({
    schema,
    selectedItem,
    activeTab,
    showNotification,
    onSchemaUpdate,
    isMobile,
    isTablet,
    router,
    onModelDoubleClick,
}) {
    try {
        // console.log('ContentRenderer called with:', {
        //   selectedItemType: selectedItem.type,
        //   activeTab,
        //   availableComponents: {
        //     ContentComponents: !!window.ContentComponents,
        //     SchemaComponents: !!window.SchemaComponents
        //   }
        // });

        if (selectedItem.type === "model") {
            const model = schema?.parsed?.models?.find(
                (m) => m.name === selectedItem.name
            )
            if (!model)
                return React.createElement(
                    "div",
                    { className: "p-6" },
                    "Model not found"
                )

            if (activeTab === "structure") {
                // Use component from content-components.js
                const ModelStructureComponent =
                    window.ContentComponents?.ModelStructure || ModelStructure
                console.log(
                    "Using ModelStructure component:",
                    !!ModelStructureComponent
                )
                return React.createElement(ModelStructureComponent, {
                    model,
                    showNotification,
                    onSchemaUpdate,
                    isMobile,
                    schema,
                })
            } else if (activeTab === "data") {
                const ModelDataComponent = window.ContentComponents?.ModelData
                console.log(
                    "ModelData component available:",
                    !!ModelDataComponent
                )
                if (!ModelDataComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "ModelData Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from content-components.js"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-xs text-yellow-600 mt-2" },
                                "Check browser console for loading errors"
                            )
                        )
                    )
                }
                return React.createElement(ModelDataComponent, {
                    model,
                    showNotification,
                    isMobile,
                })
            } else if (activeTab === "relationships") {
                const ModelRelationshipsComponent =
                    window.ContentComponents?.ModelRelationships
                if (!ModelRelationshipsComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "ModelRelationships Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from content-components.js"
                            )
                        )
                    )
                }
                return React.createElement(ModelRelationshipsComponent, {
                    model,
                    schema,
                    isMobile,
                })
            } else if (activeTab === "diagram") {
                const ModelERDiagramComponent =
                    window.ContentComponents?.ModelERDiagram
                if (!ModelERDiagramComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "ER Diagram Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from content-components.js"
                            )
                        )
                    )
                }
                return React.createElement(ModelERDiagramComponent, {
                    model,
                    schema,
                    isMobile,
                    onModelDoubleClick,
                })
            }
        }

        if (selectedItem.type === "enum") {
            const enumItem = schema?.parsed?.enums?.find(
                (e) => e.name === selectedItem.name
            )
            if (!enumItem)
                return React.createElement(
                    "div",
                    { className: "p-6" },
                    "Enum not found"
                )
            const EnumEditorComponent = window.ContentComponents?.EnumEditor
            if (!EnumEditorComponent) {
                return React.createElement(
                    "div",
                    { className: "p-6 text-center" },
                    React.createElement(
                        "div",
                        {
                            className:
                                "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                        },
                        React.createElement(
                            "h3",
                            {
                                className:
                                    "text-lg font-medium text-yellow-800",
                            },
                            "EnumEditor Component"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-yellow-700" },
                            "Component not loaded from content-components.js"
                        )
                    )
                )
            }
            return React.createElement(EnumEditorComponent, {
                enumItem,
                showNotification,
                onSchemaUpdate,
                isMobile,
            })
        }

        if (selectedItem.type === "schema") {
            if (activeTab === "editor") {
                const SchemaEditorComponent =
                    window.SchemaComponents?.SchemaEditor
                if (!SchemaEditorComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "Schema Editor Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from schema-components.js"
                            )
                        )
                    )
                }
                return React.createElement(SchemaEditorComponent, {
                    schema,
                    showNotification,
                    onSchemaUpdate,
                    isMobile,
                })
            } else if (activeTab === "migrations") {
                const MigrationManagerComponent =
                    window.SchemaComponents?.MigrationManager
                if (!MigrationManagerComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "Migration Manager Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from schema-components.js"
                            )
                        )
                    )
                }
                return React.createElement(MigrationManagerComponent, {
                    showNotification,
                    isMobile,
                })
            } else if (activeTab === "overview") {
                const SchemaOverviewComponent =
                    window.ContentComponents?.SchemaOverview
                if (!SchemaOverviewComponent) {
                    return React.createElement(
                        "div",
                        { className: "p-6 text-center" },
                        React.createElement(
                            "div",
                            {
                                className:
                                    "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                            },
                            React.createElement(
                                "h3",
                                {
                                    className:
                                        "text-lg font-medium text-yellow-800",
                                },
                                "Schema Overview Component"
                            ),
                            React.createElement(
                                "p",
                                { className: "text-yellow-700" },
                                "Component not loaded from content-components.js"
                            )
                        )
                    )
                }
                return React.createElement(SchemaOverviewComponent, {
                    schema,
                    isMobile,
                    onModelDoubleClick,
                })
            }
        }

        if (selectedItem.type === "create-model") {
            const CreateModelFormComponent =
                window.ContentComponents?.CreateModelForm
            if (!CreateModelFormComponent) {
                return React.createElement(
                    "div",
                    { className: "p-6 text-center" },
                    React.createElement(
                        "div",
                        {
                            className:
                                "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                        },
                        React.createElement(
                            "h3",
                            {
                                className:
                                    "text-lg font-medium text-yellow-800",
                            },
                            "Create Model Component"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-yellow-700" },
                            "Component not loaded from content-components.js"
                        )
                    )
                )
            }
            return React.createElement(CreateModelFormComponent, {
                schema,
                showNotification,
                onSchemaUpdate,
                isMobile,
            })
        }

        if (selectedItem.type === "create-enum") {
            const CreateEnumFormComponent =
                window.ContentComponents?.CreateEnumForm
            if (!CreateEnumFormComponent) {
                return React.createElement(
                    "div",
                    { className: "p-6 text-center" },
                    React.createElement(
                        "div",
                        {
                            className:
                                "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                        },
                        React.createElement(
                            "h3",
                            {
                                className:
                                    "text-lg font-medium text-yellow-800",
                            },
                            "Create Enum Component"
                        ),
                        React.createElement(
                            "p",
                            { className: "text-yellow-700" },
                            "Component not loaded from content-components.js"
                        )
                    )
                )
            }
            return React.createElement(CreateEnumFormComponent, {
                schema,
                showNotification,
                onSchemaUpdate,
                isMobile,
            })
        }

        return React.createElement(
            "div",
            { className: "p-6" },
            "Select an item to view its details"
        )
    } catch (error) {
        console.error("ContentRenderer error:", error)
        return React.createElement(
            "div",
            { className: "p-6 text-center" },
            React.createElement(
                "div",
                { className: "bg-red-50 border border-red-200 rounded-lg p-4" },
                React.createElement(
                    "h3",
                    { className: "text-lg font-medium text-red-800" },
                    "Error Loading Component"
                ),
                React.createElement(
                    "p",
                    { className: "text-red-700" },
                    error.message
                ),
                React.createElement(
                    "p",
                    { className: "text-xs text-red-600 mt-2" },
                    "Check browser console for details"
                )
            )
        )
    }
}

// Enhanced MainContent Component
function MainContent({
    schema,
    selectedItem,
    activeTab,
    setActiveTab,
    showNotification,
    onSchemaUpdate,
    setSidebarOpen,
    isMobile,
    isTablet,
    router,
    onModelDoubleClick,
}) {
    const contentKey = selectedItem
        ? `content-${selectedItem.type}-${selectedItem.name}`
        : "welcome"

    if (!selectedItem) {
        return React.createElement(WelcomeScreen, { setSidebarOpen, isMobile })
    }

    return React.createElement(
        "div",
        { className: "flex-1 flex flex-col min-w-0", key: contentKey },
        // Header
        React.createElement(Header, {
            selectedItem,
            setSidebarOpen,
            isMobile,
            schema,
            showNotification,
        }),

        // Tabs
        React.createElement(TabNavigation, {
            selectedItem,
            activeTab,
            setActiveTab,
            isMobile,
        }),

        // Content
        React.createElement(
            "div",
            { className: "flex-1 overflow-hidden" },
            React.createElement(ContentRenderer, {
                schema,
                selectedItem,
                activeTab,
                showNotification,
                onSchemaUpdate,
                isMobile,
                isTablet,
                router,
                onModelDoubleClick,
            })
        )
    )
}

// Main AdminPanel Component
function AdminPanel() {
    const [schema, setSchema] = useState(null)
    const [selectedItem, setSelectedItem] = useState(null)
    const [activeTab, setActiveTab] = useState("structure")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [darkMode, setDarkMode] = useState(false)
    const [modelSwitching, setModelSwitching] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const isRespondingToNavigationRef = useRef(false)

    const { notification, showNotification, hideNotification } =
        useNotification()
    const { isMobile, isTablet } = useResponsive()

    // Initialize route from URL
    const initializeFromRoute = useCallback(() => {
        if (!schema?.parsed) return

        const route = AdminRouter.parseUrl()

        if (route.type === "home") {
            setSelectedItem(null)
            setActiveTab("structure")
        } else if (route.type === "model") {
            // Check if model exists
            const model = schema.parsed.models?.find(
                (m) => m.name === route.name
            )
            if (model) {
                setSelectedItem({ type: "model", name: route.name })
                setActiveTab(route.tab)
            } else {
                // Model not found, redirect to home
                AdminRouter.navigate({ type: "home" }, true)
                setSelectedItem(null)
                setActiveTab("structure")
            }
        } else if (route.type === "enum") {
            // Check if enum exists
            const enumItem = schema.parsed.enums?.find(
                (e) => e.name === route.name
            )
            if (enumItem) {
                setSelectedItem({ type: "enum", name: route.name })
                setActiveTab("values")
            } else {
                // Enum not found, redirect to home
                AdminRouter.navigate({ type: "home" }, true)
                setSelectedItem(null)
                setActiveTab("structure")
            }
        } else if (route.type === "schema") {
            setSelectedItem({ type: "schema", name: "schema" })
            setActiveTab(route.tab)
        } else if (route.type === "create-model") {
            setSelectedItem({ type: "create-model", name: "create-model" })
            setActiveTab("form")
        } else if (route.type === "create-enum") {
            setSelectedItem({ type: "create-enum", name: "create-enum" })
            setActiveTab("form")
        }

        setIsInitializing(false)
    }, [schema])

    // Update URL when selectedItem or activeTab changes
    const updateUrlFromState = useCallback(() => {
        if (isInitializing || isRespondingToNavigationRef.current) return

        if (!selectedItem) {
            AdminRouter.navigate({ type: "home" }, true)
        } else if (selectedItem.type === "model") {
            AdminRouter.navigate(
                {
                    type: "model",
                    name: selectedItem.name,
                    tab: activeTab,
                },
                true
            )
        } else if (selectedItem.type === "enum") {
            AdminRouter.navigate(
                {
                    type: "enum",
                    name: selectedItem.name,
                },
                true
            )
        } else if (selectedItem.type === "schema") {
            AdminRouter.navigate(
                {
                    type: "schema",
                    tab: activeTab,
                },
                true
            )
        } else if (selectedItem.type === "create-model") {
            AdminRouter.navigate({ type: "create-model" }, true)
        } else if (selectedItem.type === "create-enum") {
            AdminRouter.navigate({ type: "create-enum" }, true)
        }
    }, [selectedItem, activeTab, isInitializing])

    // Handle model switching with routing
    const handleSelectItem = useCallback(
        (item) => {
            setModelSwitching(true)
            setSelectedItem(null)

            setTimeout(() => {
                setSelectedItem(item)
                setModelSwitching(false)

                // Set appropriate default tab
                if (item.type === "model") {
                    setActiveTab("structure")
                } else if (item.type === "enum") {
                    setActiveTab("values")
                } else if (item.type === "schema") {
                    setActiveTab("editor")
                } else {
                    setActiveTab("form")
                }
            }, 100)

            if (isMobile) {
                setSidebarOpen(false)
            }
        },
        [isMobile]
    )

    // Handle tab changes with routing
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab)
    }, [])

    // Handle model double-click navigation
    const handleModelDoubleClick = useCallback(
        (modelName) => {
            console.log(
                "AdminPanel handleModelDoubleClick called with:",
                modelName
            )
            console.log("AdminRouter available:", !!AdminRouter)
            console.log(
                "AdminRouter.navigateToModel available:",
                !!AdminRouter?.navigateToModel
            )

            // Check if model exists
            const model = schema?.parsed?.models?.find(
                (m) => m.name === modelName
            )
            if (model) {
                console.log(
                    "Model found, navigating to structure for:",
                    modelName
                )
                // Don't trigger navigation if we're already on this model's structure page
                const currentRoute = AdminRouter.parseUrl()
                if (
                    currentRoute.type === "model" &&
                    currentRoute.name === modelName &&
                    currentRoute.tab === "structure"
                ) {
                    console.log("Already on target page, skipping navigation")
                    return
                }
                AdminRouter.navigateToModel(modelName, "structure")
            } else {
                console.log("Model not found in schema:", modelName)
            }
        },
        [schema]
    )

    const fetchSchema = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch("/ufo-studio/api/schema", {
                headers: getAuthHeaders(),
            })
            const result = await response.json()
            if (result.success) {
                setSchema(result.data)
                window.adminSchema = result.data
            } else {
                showNotification(result.message, "error")
            }
        } catch (error) {
            showNotification("Failed to load schema", "error")
        } finally {
            setLoading(false)
        }
    }, [showNotification])

    useEffect(() => {
        fetchSchema()
    }, [fetchSchema])

    // Initialize from URL when schema is loaded
    useEffect(() => {
        if (schema?.parsed) {
            initializeFromRoute()
        }
    }, [schema, initializeFromRoute])

    // Update URL when state changes
    useEffect(() => {
        updateUrlFromState()
    }, [updateUrlFromState])

    // Listen for browser navigation (back/forward) and programmatic navigation
    useEffect(() => {
        const handlePopState = () => {
            if (schema?.parsed) {
                initializeFromRoute()
            }
        }

        const handleAdminRouteChange = () => {
            if (schema?.parsed) {
                console.log(
                    "AdminRouteChange event received, re-initializing route"
                )
                isRespondingToNavigationRef.current = true
                initializeFromRoute()
                // Reset the flag after the next render cycle
                setTimeout(() => {
                    isRespondingToNavigationRef.current = false
                }, 0)
            }
        }

        window.addEventListener("popstate", handlePopState)
        window.addEventListener("adminRouteChange", handleAdminRouteChange)

        return () => {
            window.removeEventListener("popstate", handlePopState)
            window.removeEventListener(
                "adminRouteChange",
                handleAdminRouteChange
            )
        }
    }, [schema, initializeFromRoute])

    // Filter models and enums based on search
    const filteredModels = useMemo(() => {
        if (!schema?.parsed?.models) return []
        return schema.parsed.models.filter((model) =>
            model.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [schema, searchTerm])

    const filteredEnums = useMemo(() => {
        if (!schema?.parsed?.enums) return []
        return schema.parsed.enums.filter((enumItem) =>
            enumItem.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [schema, searchTerm])

    if (loading) {
        return React.createElement(LoadingScreen)
    }

    return React.createElement(
        "div",
        { className: `h-screen flex ${darkMode ? "dark" : ""}` },

        // Notification
        React.createElement(NotificationManager, {
            notification,
            onClose: hideNotification,
        }),

        // Mobile Overlay
        isMobile &&
            sidebarOpen &&
            React.createElement("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 z-40",
                onClick: () => setSidebarOpen(false),
            }),

        // Sidebar
        React.createElement(window.Components?.Sidebar || SimpleSidebar, {
            schema,
            selectedItem,
            setSelectedItem: handleSelectItem,
            searchTerm,
            setSearchTerm,
            filteredModels,
            filteredEnums,
            sidebarOpen,
            setSidebarOpen,
            isMobile,
            onRefresh: fetchSchema,
            darkMode,
            setDarkMode,
            router: AdminRouter,
        }),

        // Main Content
        modelSwitching
            ? React.createElement(
                  "div",
                  { className: "flex-1 flex items-center justify-center" },
                  React.createElement("div", {
                      className:
                          "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500",
                  })
              )
            : React.createElement(MainContent, {
                  schema,
                  selectedItem,
                  activeTab,
                  setActiveTab: handleTabChange,
                  showNotification,
                  onSchemaUpdate: fetchSchema,
                  setSidebarOpen,
                  isMobile,
                  isTablet,
                  router: AdminRouter,
                  onModelDoubleClick: handleModelDoubleClick,
              })
    )
}

// Make AdminRouter globally available
window.AdminRouter = AdminRouter

// Initialize the application with React 18 syntax (fallback to legacy for compatibility)
if (ReactDOM.createRoot) {
    const root = ReactDOM.createRoot(document.getElementById("root"))
    root.render(React.createElement(AdminPanel))
} else {
    // Fallback for older React versions
    ReactDOM.render(
        React.createElement(AdminPanel),
        document.getElementById("root")
    )
}
