// Main Content Components

// Component: Header
function Header({ selectedItem, setSidebarOpen, isMobile, schema, showNotification }) {
  const getItemDetails = () => {
    if (selectedItem.type === 'model') {
      const model = schema?.parsed?.models?.find(m => m.name === selectedItem.name);
      return {
        icon: 'fa-table',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        count: model?.fields?.length || 0,
        label: 'fields'
      };
    } else {
      const enumItem = schema?.parsed?.enums?.find(e => e.name === selectedItem.name);
      return {
        icon: 'fa-list',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        count: enumItem?.values?.length || 0,
        label: 'values'
      };
    }
  };

  const handleDelete = async () => {
    const itemType = selectedItem.type;
    const itemName = selectedItem.name;
    
    if (!confirm(`Are you sure you want to delete the ${itemType} "${itemName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      let apiUrl = '';
      if (itemType === 'model') {
        apiUrl = `/ufo-studio/api/schema/model/${itemName}`;
      } else if (itemType === 'enum') {
        apiUrl = `/ufo-studio/api/schema/enum/${itemName}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      if (result.success) {
        showNotification(`${itemType} deleted successfully`);
        window.location.reload();
      } else {
        throw new Error(result.message || `Failed to delete ${itemType}`);
      }
    } catch (error) {
      showNotification(`Failed to delete ${itemType}: ${error.message}`, 'error');
    }
  };

  const details = getItemDetails();

  return React.createElement('div', { 
    className: 'bg-white border-b border-gray-200 px-4 sm:px-6 py-4',
    key: `header-${selectedItem.type}-${selectedItem.name}`
  },
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement('div', { className: 'flex items-center min-w-0 flex-1' },
        isMobile && React.createElement('button', {
          onClick: () => setSidebarOpen(true),
          className: 'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg mr-3 transition-colors'
        },
          React.createElement('i', { className: 'fas fa-bars' })
        ),
        
        React.createElement('div', {
          className: `w-10 h-10 ${details.bgColor} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`
        },
          React.createElement('i', { className: `fas ${details.icon} ${details.color}` })
        ),
        
        React.createElement('div', { className: 'min-w-0 flex-1' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement('h1', { className: 'text-xl font-semibold text-gray-900 truncate' }, selectedItem.name),
            React.createElement('span', {
              className: 'ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium uppercase'
            }, selectedItem.type)
          ),
          React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, `${details.count} ${details.label}`)
        )
      ),
      
      React.createElement('div', { className: 'flex items-center space-x-2 flex-shrink-0' },
        selectedItem.type === 'model' && React.createElement(CreateRecordButton, {
          modelName: selectedItem.name,
          schema: schema,
          showNotification: showNotification,
          compact: isMobile
        }),
        
        (selectedItem.type === 'model' || selectedItem.type === 'enum') && React.createElement('button', {
          onClick: handleDelete,
          className: 'inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm'
        },
          React.createElement('i', { className: 'fas fa-trash mr-1 sm:mr-2' }),
          !isMobile && React.createElement('span', {}, 'Delete')
        )
      )
    )
  );
}

// Component: TabNavigation
function TabNavigation({ selectedItem, activeTab, setActiveTab, isMobile }) {
  const getTabs = () => {
    if (selectedItem.type === 'model') {
      return [
        { id: 'structure', label: 'Structure', icon: 'fa-table' },
        { id: 'data', label: 'Data', icon: 'fa-database' },
        { id: 'relationships', label: 'Relations', icon: 'fa-project-diagram' },
        { id: 'diagram', label: 'ER Diagram', icon: 'fa-sitemap' }
      ];
    } else if (selectedItem.type === 'enum') {
      return [
        { id: 'values', label: 'Values', icon: 'fa-list' }
      ];
    } else if (selectedItem.type === 'schema') {
      return [
        { id: 'editor', label: 'Schema Editor', icon: 'fa-code' },
        { id: 'migrations', label: 'Migrations', icon: 'fa-cogs' },
        { id: 'overview', label: 'Schema Overview', icon: 'fa-sitemap' }
      ];
    } else if (selectedItem.type === 'create-model') {
      return [
        { id: 'form', label: 'Create Model', icon: 'fa-table' }
      ];
    } else if (selectedItem.type === 'create-enum') {
      return [
        { id: 'form', label: 'Create Enum', icon: 'fa-list' }
      ];
    } else {
      return [
        { id: 'form', label: 'Create', icon: 'fa-plus' }
      ];
    }
  };

  const tabs = getTabs();

  return React.createElement('div', { 
    className: 'bg-white border-b border-gray-200',
    key: `tabs-${selectedItem.type}-${selectedItem.name}`
  },
    React.createElement('div', { className: 'px-4 sm:px-6' },
      React.createElement('nav', { className: 'flex space-x-6 sm:space-x-8 overflow-x-auto' },
        ...tabs.map(tab => 
          React.createElement('button', {
            key: tab.id,
            onClick: () => setActiveTab(tab.id),
            className: `flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`
          },
            React.createElement('i', { className: `fas ${tab.icon} mr-1 sm:mr-2 text-xs` }),
            React.createElement('span', { className: isMobile ? 'text-xs' : '' }, tab.label)
          )
        )
      )
    )
  );
}

// Component: ContentRenderer
function ContentRenderer({ schema, selectedItem, activeTab, showNotification, onSchemaUpdate, isMobile, isTablet }) {
  if (selectedItem.type === 'model') {
    const model = schema?.parsed?.models?.find(m => m.name === selectedItem.name);
    if (!model) return React.createElement('div', { className: 'p-6' }, 'Model not found');
    
    if (activeTab === 'structure') {
      return React.createElement(ModelStructure, { model, showNotification, onSchemaUpdate, isMobile, schema });
    } else if (activeTab === 'data') {
      return React.createElement(ModelData, { model, showNotification, isMobile });
    } else if (activeTab === 'relationships') {
      return React.createElement(ModelRelationships, { model, schema, isMobile });
    } else if (activeTab === 'diagram') {
      return React.createElement('div', { className: 'p-6' }, 'ER Diagram coming soon...');
    }
  }
  
  if (selectedItem.type === 'enum') {
    const enumItem = schema?.parsed?.enums?.find(e => e.name === selectedItem.name);
    if (!enumItem) return React.createElement('div', { className: 'p-6' }, 'Enum not found');
    return React.createElement(EnumEditor, { enumItem, showNotification, onSchemaUpdate, isMobile });
  }
  
  if (selectedItem.type === 'schema') {
    if (activeTab === 'editor') {
      return React.createElement(SchemaEditor, { schema, showNotification, onSchemaUpdate, isMobile });
    } else if (activeTab === 'migrations') {
      return React.createElement(MigrationManager, { showNotification, isMobile });
    } else if (activeTab === 'overview') {
      return React.createElement('div', { className: 'p-6' }, 'Schema Overview coming soon...');
    }
  }
  
  if (selectedItem.type === 'create-model') {
    return React.createElement(CreateModelForm, { schema, showNotification, onSchemaUpdate, isMobile });
  }
  
  if (selectedItem.type === 'create-enum') {
    return React.createElement(CreateEnumForm, { schema, showNotification, onSchemaUpdate, isMobile });
  }
  
  return React.createElement('div', { className: 'p-6' }, 'Select an item to view its details');
}

// Component: ModelStructure
function ModelStructure({ model, showNotification, onSchemaUpdate, isMobile, schema }) {
  const [editMode, setEditMode] = useState(false);

  const renderFieldBadge = (field) => {
    const fieldType = getFieldType(field, schema);
    const relationInfo = fieldType === 'relation' ? getRelationInfo(field) : null;
    
    if (fieldType === 'relation') {
      return React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('span', { className: 'field-badge field-relation' }, 'RELATION'),
        React.createElement('span', { className: 'text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded' },
          `→ ${relationInfo.targetModel}`
        )
      );
    }
    
    return React.createElement('span', { 
      className: `field-badge field-${fieldType.replace('-', '')}` 
    }, fieldType.toUpperCase().replace('-', ' '));
  };

  const getRelationInfo = (field) => {
    const type = field.type;
    const isArray = type.includes('[]');
    let targetModel = type.split(' ')[0].replace('[]', '').replace('?', '');
    const isExplicitRelation = type.includes('@relation');
    
    let relationType = 'One-to-One';
    if (isArray && !isExplicitRelation) {
      relationType = 'One-to-Many';
    } else if (isExplicitRelation) {
      relationType = isArray ? 'Many-to-Many' : 'Many-to-One';
    } else if (isArray) {
      relationType = 'One-to-Many';
    }
    
    return {
      targetModel,
      isArray,
      isExplicitRelation,
      relationType,
      isForeignKey: isExplicitRelation && !isArray
    };
  };

  return React.createElement('div', { className: 'p-4 sm:p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
      // Header
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between' },
        React.createElement('div', {},
          React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Table Structure'),
          React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, `${model.fields.length} columns`)
        ),
        React.createElement('button', {
          onClick: () => setEditMode(!editMode),
          className: 'px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm'
        },
          React.createElement('i', { className: 'fas fa-edit mr-1' }),
          'Edit Structure'
        )
      ),

      // Table
      isMobile ? React.createElement('div', { className: 'divide-y divide-gray-200' },
        ...model.fields.map(field =>
          React.createElement('div', { key: field.name, className: 'p-4' },
            React.createElement('div', { className: 'flex items-center justify-between mb-2' },
              React.createElement('div', { className: 'flex items-center' },
                React.createElement('i', { 
                  className: `fas fa-key mr-2 ${isPrimaryKey(field) ? 'text-yellow-500' : 'text-gray-300'}` 
                }),
                React.createElement('span', { className: 'font-medium text-gray-900' }, field.name)
              )
            ),
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              renderFieldBadge(field),
              isRequired(field) && React.createElement('span', {
                className: 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'
              }, 'Required'),
              isUnique(field) && React.createElement('span', {
                className: 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
              }, 'Unique'),
              isPrimaryKey(field) && React.createElement('span', {
                className: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'
              }, 'Primary Key')
            )
          )
        )
      ) : React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', {},
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Column'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Type'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Constraints')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            ...model.fields.map(field =>
              React.createElement('tr', { key: field.name },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('i', { 
                      className: `fas fa-key mr-2 ${isPrimaryKey(field) ? 'text-yellow-500' : 'text-gray-300'}` 
                    }),
                    React.createElement('span', { className: 'text-sm font-medium text-gray-900' }, field.name)
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  renderFieldBadge(field)
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex flex-wrap gap-1' },
                    isRequired(field) && React.createElement('span', {
                      className: 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'
                    }, 'Required'),
                    isUnique(field) && React.createElement('span', {
                      className: 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                    }, 'Unique'),
                    isPrimaryKey(field) && React.createElement('span', {
                      className: 'px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'
                    }, 'Primary Key')
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

// Placeholder components
function ModelData({ model, showNotification, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, `${model.name} Data`),
      React.createElement('p', { className: 'text-gray-600' }, 'Data management interface coming soon...')
    )
  );
}

function ModelRelationships({ model, schema, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, `${model.name} Relationships`),
      React.createElement('p', { className: 'text-gray-600' }, 'Relationship viewer coming soon...')
    )
  );
}

function EnumEditor({ enumItem, showNotification, onSchemaUpdate, isMobile }) {
  const [editMode, setEditMode] = useState(false);
  
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between' },
        React.createElement('div', {},
          React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Enum Values'),
          React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, `${enumItem.values.length} values`)
        ),
        React.createElement('button', {
          onClick: () => setEditMode(!editMode),
          className: 'px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm'
        },
          React.createElement('i', { className: 'fas fa-edit mr-1' }),
          'Edit Values'
        )
      ),
      React.createElement('div', { className: 'p-6' },
        React.createElement('div', { className: 'space-y-3' },
          ...enumItem.values.map((value, index) =>
            React.createElement('div', { key: value, className: 'flex items-center space-x-3' },
              React.createElement('div', { className: 'flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center' },
                React.createElement('span', { className: 'text-sm font-medium text-purple-600' }, index + 1)
              ),
              React.createElement('div', { className: 'flex-1' },
                React.createElement('span', { className: 'text-sm font-medium text-gray-900' }, value)
              )
            )
          )
        )
      )
    )
  );
}

function SchemaEditor({ schema, showNotification, onSchemaUpdate, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Schema Editor'),
      React.createElement('p', { className: 'text-gray-600' }, 'Schema editor coming soon...')
    )
  );
}

function MigrationManager({ showNotification, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Migration Manager'),
      React.createElement('p', { className: 'text-gray-600' }, 'Migration tools coming soon...')
    )
  );
}

function CreateModelForm({ schema, showNotification, onSchemaUpdate, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Create Model'),
      React.createElement('p', { className: 'text-gray-600' }, 'Model creation form coming soon...')
    )
  );
}

function CreateEnumForm({ schema, showNotification, onSchemaUpdate, isMobile }) {
  return React.createElement('div', { className: 'p-6' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Create Enum'),
      React.createElement('p', { className: 'text-gray-600' }, 'Enum creation form coming soon...')
    )
  );
}

// Enhanced MainContent Component
function EnhancedMainContent({ 
  schema, selectedItem, activeTab, setActiveTab, showNotification, 
  onSchemaUpdate, setSidebarOpen, isMobile, isTablet 
}) {
  const contentKey = selectedItem ? `content-${selectedItem.type}-${selectedItem.name}` : 'welcome';
  
  if (!selectedItem) {
    return React.createElement(WelcomeScreen, { setSidebarOpen, isMobile });
  }

  return React.createElement('div', { className: 'flex-1 flex flex-col min-w-0', key: contentKey },
    // Header
    React.createElement(Header, {
      selectedItem,
      setSidebarOpen,
      isMobile,
      schema,
      showNotification
    }),
    
    // Tabs
    React.createElement(TabNavigation, {
      selectedItem,
      activeTab,
      setActiveTab,
      isMobile
    }),
    
    // Content
    React.createElement('div', { className: 'flex-1 overflow-hidden' },
      React.createElement(ContentRenderer, {
        schema,
        selectedItem,
        activeTab,
        showNotification,
        onSchemaUpdate,
        isMobile,
        isTablet
      })
    )
  );
}

// Export components
window.MainContentComponents = {
  Header,
  TabNavigation,
  ContentRenderer,
  ModelStructure,
  ModelData,
  ModelRelationships,
  EnumEditor,
  SchemaEditor,
  MigrationManager,
  CreateModelForm,
  CreateEnumForm,
  EnhancedMainContent
}; 