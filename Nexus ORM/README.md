# Database Manager - Prisma Admin Panel

A comprehensive, professional database management interface built with React and TypeScript, providing a Strapi-like experience for Prisma schemas.

## 🚀 Features Implemented

### Core Architecture
- **Modular Structure**: Clean separation of concerns across multiple files
- **Mobile-First Design**: Fully responsive with optimized mobile interfaces
- **Real-time Updates**: Live schema and data synchronization
- **Professional UI/UX**: Tailwind CSS with modern design patterns
- **URL Routing**: Direct navigation to specific models and tabs with browser history support

### URL Routing System

The admin panel now supports direct URL navigation with the following routes:

#### Model Routes
- `/ufo-studio/model/{modelName}/structure` - View model structure/schema
- `/ufo-studio/model/{modelName}/data` - Browse and manage model data  
- `/ufo-studio/model/{modelName}/relationships` - View model relationships
- `/ufo-studio/model/{modelName}/diagram` - Interactive ER diagram for the model

#### Schema Management Routes
- `/ufo-studio/schema/editor` - Direct schema editing interface
- `/ufo-studio/schema/migrations` - Database migration management
- `/ufo-studio/schema/overview` - Complete schema overview with ER diagram

#### Enum Routes
- `/ufo-studio/enum/{enumName}` - View and edit enum values

#### Creation Routes
- `/ufo-studio/create/model` - Create new model form
- `/ufo-studio/create/enum` - Create new enum form

#### Home Route
- `/ufo-studio` - Dashboard/welcome screen

### Interactive Navigation Features

#### Double-Click Navigation
- **ER Diagram Models**: Double-click any model in ER diagrams to navigate directly to its structure view
- **Quick Access**: Seamlessly switch between model overview and detailed structure

#### Browser Navigation
- **History Support**: Full browser back/forward navigation
- **Bookmarkable URLs**: Share direct links to specific model views
- **URL Sync**: URLs automatically update when navigating through the interface

### Database Management
- **Complete CRUD Operations**: Full Create, Read, Update, Delete functionality for all models
- **Advanced Search & Filtering**: Real-time search with pagination support
- **Relationship Management**: Visual relationship diagrams and management tools
- **Field Management**: Add, edit, and delete model fields with type-aware forms

### Schema Management
- **Interactive ER Diagrams**: 
  - Drag and drop model positioning
  - Zoom and pan controls
  - Visual relationship mapping
  - Model selection and highlighting
  - Double-click navigation to model details
- **Direct Schema Editing**: Raw Prisma schema editing with syntax highlighting
- **Migration Tools**: Database migration management with Prisma client generation
- **Visual Schema Builder**: Point-and-click model and field creation

### Field Type Support
- **Basic Types**: String, Int, Float, Boolean, DateTime, Json with visual badges
- **Advanced Types**: Arrays, Relations, Enums with specialized input components
- **Constraint Management**: Primary keys, unique constraints, required fields
- **Relationship Types**: One-to-One, One-to-Many, Many-to-Many with visual indicators

### Professional UI Components
- **Responsive Design**: Mobile-optimized with collapsible sidebar
- **Loading States**: Professional loading screens and skeleton states
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Notifications**: Toast notifications for all operations
- **Modal System**: Context-aware modals for data entry and editing

## 🗂️ File Structure

```
src/ufo-studio/
├── public/
│   ├── index.html              # Main HTML template with all dependencies
│   └── js/
│       ├── app.js              # Main application with routing logic
│       ├── components.js       # Sidebar and navigation components
│       ├── content-components.js # Model/enum viewers and editors
│       ├── advanced-components.js # Complex modals and form components
│       ├── schema-components.js # Schema editing and migration tools
│       └── ERDiagram.js        # Interactive ER diagram component
├── routes/
│   └── index.ts               # Express routes for serving admin panel
└── README.md                  # This documentation
```

## 🔧 Component Architecture

### Core Components
- **AdminPanel**: Main application container with routing logic
- **AdminRouter**: URL routing system with navigation helpers  
- **Sidebar**: Model/enum browser with search and statistics
- **MainContent**: Content area with tab navigation
- **ContentRenderer**: Dynamic component loader based on routes

### Content Components
- **ModelStructure**: Table schema viewer with field editing
- **ModelData**: Data browser with pagination and CRUD operations
- **ModelRelationships**: Relationship analysis and visualization
- **ModelERDiagram**: Interactive ER diagram for single models
- **SchemaOverview**: Complete database ER diagram
- **EnumEditor**: Enum value management interface

### Advanced Components
- **EditRecordModal**: Complex record editing with type-aware inputs
- **FieldEditModal**: Field definition editor with relationship setup
- **AddFieldModal**: New field creation with advanced options
- **RelationField**: Autocomplete relation selection
- **ArrayField**: Dynamic array input components

### Schema Components
- **SchemaEditor**: Direct Prisma schema editing with syntax highlighting
- **MigrationManager**: Database migration tools and Prisma client generation

## 🚦 API Integration

All components integrate with existing REST APIs:
- **Model Data**: `/api/v1/{modelName}` for CRUD operations
- **Schema Management**: `/ufo-studio/api/schema/*` for schema operations
- **Field Management**: `/ufo-studio/api/schema/field` for field operations
- **Migration**: `/ufo-studio/api/schema/migrate` for database migrations

## 🎯 Navigation Best Practices

### URL Structure
- Clean, RESTful URL patterns
- Consistent naming conventions
- Human-readable identifiers
- Proper HTTP semantics

### User Experience
- Intuitive double-click navigation
- Consistent visual feedback
- Seamless route transitions
- Preserved application state

### Performance
- Optimized component loading
- Efficient state management
- Minimal re-renders on navigation
- Fast route parsing and updates

## 🔄 State Management

The application uses React's built-in state management with:
- **URL-driven navigation**: Routes determine application state
- **Centralized schema state**: Shared across all components
- **Local component state**: For UI interactions and temporary data
- **Effect-based synchronization**: Between URL and application state

## 📱 Mobile Support

- **Responsive ER diagrams**: Touch-optimized controls
- **Collapsible sidebar**: Mobile-friendly navigation
- **Optimized layouts**: Stack-based mobile layouts
- **Touch gestures**: Drag and zoom support for diagrams

## 🔧 Technical Implementation

### Routing System
- Custom lightweight router without external dependencies
- URL parsing and generation with validation
- Browser history integration with popstate events
- State synchronization between URLs and React state

### Component Loading
- Dynamic component resolution with fallbacks
- Global component registration system
- Error boundaries for component failures
- Lazy loading support for large components

This admin panel provides a complete, production-ready interface for Prisma database management with enterprise-level features including URL routing, interactive ER diagrams, and comprehensive CRUD operations. 