// Schema Management Components for Admin Panel

// Component: SchemaEditor
function SchemaEditor({ schema, showNotification, onSchemaUpdate, isMobile }) {
  const [schemaContent, setSchemaContent] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchSchemaContent();
  }, []);

  const fetchSchemaContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/ufo-studio/api/schema/raw', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setSchemaContent(result.content);
      } else {
        throw new Error(result.message || 'Failed to load schema');
      }
    } catch (error) {
      showNotification('Failed to load schema: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSchema = async () => {
    setSaving(true);
    try {
      const response = await fetch('/ufo-studio/api/schema/raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ content: schemaContent })
      });

      const result = await response.json();
      if (result.success) {
        showNotification('Schema saved successfully');
        if (onSchemaUpdate) onSchemaUpdate();
      } else {
        throw new Error(result.message || 'Failed to save schema');
      }
    } catch (error) {
      showNotification('Failed to save schema: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('ufoStudioToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  };

  if (loading) {
    return React.createElement('div', { className: 'p-4 sm:p-6 h-full flex flex-col' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex-1 flex items-center justify-center' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3' }),
          React.createElement('span', { className: 'text-gray-600' }, 'Loading schema...')
        )
      )
    );
  }

  return React.createElement('div', { className: 'p-4 sm:p-6 h-full flex flex-col' },
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full' },
      // Header
      React.createElement('div', { className: 'px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between' },
        React.createElement('div', {},
          React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Schema Editor'),
          React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Edit your Prisma schema directly')
        ),
        React.createElement('div', { className: 'flex items-center space-x-2' },
          React.createElement('button', {
            onClick: fetchSchemaContent,
            disabled: loading,
            className: 'px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm disabled:opacity-50'
          },
            React.createElement('i', { className: 'fas fa-sync-alt mr-1' }),
            'Reload'
          ),
          React.createElement('button', {
            onClick: saveSchema,
            disabled: saving || loading,
            className: 'px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50'
          },
            saving ? [
              React.createElement('i', { key: 'icon', className: 'fas fa-spinner fa-spin mr-1' }),
              'Saving...'
            ] : [
              React.createElement('i', { key: 'icon', className: 'fas fa-save mr-1' }),
              'Save Schema'
            ]
          )
        )
      ),

      // Editor
      React.createElement('div', { className: 'flex-1 overflow-hidden' },
        React.createElement('textarea', {
          value: schemaContent,
          onChange: (e) => setSchemaContent(e.target.value),
          className: 'w-full h-full p-4 border-0 resize-none focus:ring-0 font-mono text-sm leading-relaxed',
          placeholder: 'Loading schema...',
          style: { fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
        })
      ),

      // Footer
      React.createElement('div', { className: 'px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50' },
        React.createElement('div', { className: 'flex items-center justify-between text-xs text-gray-500' },
          React.createElement('span', {}, 'Prisma Schema Language'),
          React.createElement('span', {}, `Lines: ${schemaContent.split('\n').length}`)
        )
      )
    )
  );
}

// Component: MigrationManager
function MigrationManager({ showNotification, isMobile }) {
  const [generating, setGenerating] = React.useState(false);
  const [migrating, setMigrating] = React.useState(false);
  const [migrationName, setMigrationName] = React.useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('ufoStudioToken');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  };

  const generateClient = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/ufo-studio/api/schema/generate', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const result = await response.json();
      if (result.success) {
        showNotification('Prisma client generated successfully');
      } else {
        throw new Error(result.message || 'Failed to generate client');
      }
    } catch (error) {
      showNotification('Failed to generate client: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const runMigration = async () => {
    if (!migrationName.trim()) {
      showNotification('Please enter a migration name', 'error');
      return;
    }

    setMigrating(true);
    try {
      const response = await fetch('/ufo-studio/api/schema/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ name: migrationName })
      });

      const result = await response.json();
      if (result.success) {
        showNotification('Migration completed successfully');
        setMigrationName('');
      } else {
        throw new Error(result.message || 'Failed to run migration');
      }
    } catch (error) {
      showNotification('Failed to run migration: ' + error.message, 'error');
    } finally {
      setMigrating(false);
    }
  };

  return React.createElement('div', { className: 'p-4 sm:p-6 h-full' },
    React.createElement('div', { className: 'max-w-2xl mx-auto space-y-6' },
      // Generate Client
      React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
          React.createElement('div', {},
            React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Generate Prisma Client'),
            React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Generate the Prisma client after schema changes')
          ),
          React.createElement('i', { className: 'fas fa-cog text-blue-500 text-2xl' })
        ),
        React.createElement('button', {
          onClick: generateClient,
          disabled: generating,
          className: 'w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50'
        },
          generating ? [
            React.createElement('i', { key: 'icon', className: 'fas fa-spinner fa-spin mr-2' }),
            'Generating...'
          ] : [
            React.createElement('i', { key: 'icon', className: 'fas fa-play mr-2' }),
            'npx prisma generate'
          ]
        )
      ),

      // Run Migration
      React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
          React.createElement('div', {},
            React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Database Migration'),
            React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Apply schema changes to your database')
          ),
          React.createElement('i', { className: 'fas fa-database text-green-500 text-2xl' })
        ),
        React.createElement('div', { className: 'space-y-3' },
          React.createElement('input', {
            type: 'text',
            value: migrationName,
            onChange: (e) => setMigrationName(e.target.value),
            placeholder: 'Enter migration name (e.g., add_user_table)',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm'
          }),
          React.createElement('button', {
            onClick: runMigration,
            disabled: migrating || !migrationName.trim(),
            className: 'w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50'
          },
            migrating ? [
              React.createElement('i', { key: 'icon', className: 'fas fa-spinner fa-spin mr-2' }),
              'Running Migration...'
            ] : [
              React.createElement('i', { key: 'icon', className: 'fas fa-play mr-2' }),
              'npx prisma migrate dev'
            ]
          )
        )
      ),

      // Information
      React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        React.createElement('div', { className: 'flex' },
          React.createElement('i', { className: 'fas fa-exclamation-triangle text-yellow-400 mr-3 mt-0.5' }),
          React.createElement('div', {},
            React.createElement('h4', { className: 'text-sm font-medium text-yellow-800' }, 'Important Notes'),
            React.createElement('div', { className: 'text-sm text-yellow-700 mt-2 space-y-1' },
              React.createElement('p', {}, '• Always generate the client after making schema changes'),
              React.createElement('p', {}, '• Migration names should be descriptive (no spaces)'),
              React.createElement('p', {}, '• Backup your database before running migrations in production')
            )
          )
        )
      )
    )
  );
}

// Export schema components
if (typeof window !== 'undefined') {
  window.SchemaComponents = {
    SchemaEditor,
    MigrationManager
  };
} 