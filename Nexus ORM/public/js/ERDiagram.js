// Interactive ER Diagram Component
window.UIComponents = window.UIComponents || {};

// Simple Button component for ERDiagram controls
window.UIComponents.Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    disabled = false, 
    title, 
    className = '' 
}) => {
    const { createElement: h } = React;
    
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200';
    const variantClasses = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
        success: 'bg-green-500 hover:bg-green-600 text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white'
    };
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base'
    };
    
    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${className}`;
    
    return h('button', {
        onClick: disabled ? undefined : onClick,
        className: buttonClasses,
        disabled,
        title
    }, [
        icon && h('i', { 
            key: 'icon', 
            className: `${icon} ${children ? 'mr-1' : ''}` 
        }),
        children && h('span', { key: 'text' }, children)
    ]);
};

window.UIComponents.ERDiagram = ({ 
    schema,
    onModelClick = () => {},
    onModelDoubleClick = () => {},
    onRelationshipClick = () => {},
    className = '',
    height = '600px',
    width = '100%'
}) => {
    const { createElement: h, useState, useEffect, useRef, useCallback } = React;
    const [modelPositions, setModelPositions] = useState({});
    const [selectedModel, setSelectedModel] = useState(null);
    const [dragState, setDragState] = useState({ isDragging: false, model: null, offset: { x: 0, y: 0 } });
    const [zoom, setZoom] = useState(0.8);
    const [pan, setPan] = useState({ x: 50, y: 50 });
    const [showRelationshipLabels, setShowRelationshipLabels] = useState(true);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [showHelp, setShowHelp] = useState(false);
    const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const clickTimeout = useRef(null);
    const clickCount = useRef(0);
    
    // Get models from schema
    const models = schema?.parsed?.models || [];
    
    // Calculate initial positions for models in a smart grid layout
    const calculateInitialPositions = useCallback(() => {
        if (models.length === 0) return {};
        
        const positions = {};
        
        // Calculate grid dimensions
        const modelCount = models.length;
        const cols = Math.ceil(Math.sqrt(modelCount * 1.2)); // Slightly wider than square
        const rows = Math.ceil(modelCount / cols);
        
        // Model dimensions and spacing
        const modelWidth = 200;
        const modelHeight = 120;
        const horizontalSpacing = 280; // More space between models
        const verticalSpacing = 200;
        
        // Calculate total grid size
        const totalWidth = (cols - 1) * horizontalSpacing;
        const totalHeight = (rows - 1) * verticalSpacing;
        
        // Position grid to be visible in typical viewport
        // Start from visible coordinates instead of centering at (0,0)
        const viewportOffsetX = 0; // Offset from left edge
        const viewportOffsetY = 0; // Offset from top edge
        
        const startX = viewportOffsetX - totalWidth / 2;
        const startY = viewportOffsetY - totalHeight / 2;
        
        // Position models in grid
        models.forEach((model, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Add some variation to avoid perfect grid monotony
            const jitterX = (Math.random() - 0.5) * 20;
            const jitterY = (Math.random() - 0.5) * 20;
            
            positions[model.name] = {
                x: startX + col * horizontalSpacing + jitterX,
                y: startY + row * verticalSpacing + jitterY
            };
        });
        
        return positions;
    }, [models]);
    


    // Fit to screen function - defined early to avoid hoisting issues
    const fitToScreen = useCallback(() => {
        if (!svgRef.current || !containerRef.current) return;
        
        const container = containerRef.current.getBoundingClientRect();
        const modelsCount = models.length;
        
        if (modelsCount === 0) return;
        
        // Calculate grid dimensions (same as in calculateInitialPositions)
        const cols = Math.ceil(Math.sqrt(modelsCount * 1.2));
        const rows = Math.ceil(modelsCount / cols);
        const horizontalSpacing = 280;
        const verticalSpacing = 200;
        
        // Calculate total content size
        const totalWidth = (cols - 1) * horizontalSpacing + 200; // +200 for model width
        const totalHeight = (rows - 1) * verticalSpacing + 120; // +120 for model height
        
        // Calculate zoom to fit with some padding
        const padding = 80;
        const scaleX = (container.width - padding * 2) / totalWidth;
        const scaleY = (container.height - padding * 2) / totalHeight;
        const optimalZoom = Math.min(1.2, Math.max(0.3, Math.min(scaleX, scaleY)));
        
        setZoom(optimalZoom);
        
        // Center the view better accounting for initial model positions
        const viewportOffsetX = 400;
        const viewportOffsetY = 300;
        const centerX = container.width / 2 - viewportOffsetX * optimalZoom;
        const centerY = container.height / 2 - viewportOffsetY * optimalZoom;
        
        setPan({ x: centerX, y: centerY });
    }, [models.length]);

    // Initialize model positions
    useEffect(() => {
        const savedPositions = localStorage.getItem('erDiagramPositions');
        if (savedPositions) {
            try {
                const parsed = JSON.parse(savedPositions);
                // Verify all current models have positions
                const hasAllModels = models.every(model => parsed[model.name]);
                if (hasAllModels) {
                    setModelPositions(parsed);
                    return;
                }
            } catch (error) {
                console.warn('Failed to parse saved positions:', error);
            }
        }
        
        setModelPositions(calculateInitialPositions());
    }, [calculateInitialPositions]);

    // Auto-fit to screen only when models are first loaded AND no saved positions exist
    useEffect(() => {
        if (models.length > 0 && Object.keys(modelPositions).length > 0 && !hasInitiallyLoaded) {
            // Check if this is truly the first load (no saved positions)
            const savedPositions = localStorage.getItem('erDiagramPositions');
            if (!savedPositions) {
                // Small delay to ensure the component is fully rendered
                const timer = setTimeout(() => {
                    fitToScreen();
                    setHasInitiallyLoaded(true);
                }, 100);
                return () => clearTimeout(timer);
            } else {
                setHasInitiallyLoaded(true);
            }
        }
    }, [models.length, modelPositions, fitToScreen, hasInitiallyLoaded]);
    
    // Save positions to localStorage
    useEffect(() => {
        if (Object.keys(modelPositions).length > 0) {
            localStorage.setItem('erDiagramPositions', JSON.stringify(modelPositions));
        }
    }, [modelPositions]);
    
    // Get relationships between models
    const getRelationships = useCallback(() => {
        const relationships = [];
        
        models.forEach(model => {
            model.fields?.forEach(field => {
                if (field.type.includes('@relation') || isModelReference(field)) {
                    const targetModel = getRelatedModelName(field);
                    if (targetModel && models.some(m => m.name === targetModel)) {
                        relationships.push({
                            from: model.name,
                            to: targetModel,
                            field: field.name,
                            type: getRelationType(field),
                            isArray: field.type.includes('[]'),
                            isOptional: field.type.includes('?')
                        });
                    }
                }
            });
        });
        
        return relationships;
    }, [models]);


    
    // Helper functions
    const isModelReference = (field) => {
        if (!schema?.parsed?.models) return false;
        const baseType = field.type.split(' ')[0].replace('[]', '').replace('?', '');
        return schema.parsed.models.some(model => model.name === baseType);
    };
    
    const getRelatedModelName = (field) => {
        return field.type.split(' ')[0].replace('[]', '').replace('?', '');
    };
    
    const getRelationType = (field) => {
        if (field.type.includes('[]')) return 'one-to-many';
        if (field.type.includes('?')) return 'optional';
        return 'one-to-one';
    };
    
      // Handle model clicks with double-click detection
  const handleModelClick = (e, modelName) => {
    e.preventDefault();
    e.stopPropagation();
    
    clickCount.current += 1;
    
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }
    
    clickTimeout.current = setTimeout(() => {
      if (clickCount.current === 1) {
        // Single click - select model and handle dragging
        console.log('Single click on model:', modelName);
        setSelectedModel(modelName);
        onModelClick({ name: modelName });
        
        // Set up for potential dragging
        const rect = svgRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        const modelPos = modelPositions[modelName];
        
        setDragState({
          isDragging: false, // Don't start dragging immediately
          model: modelName,
          offset: {
            x: x - modelPos.x,
            y: y - modelPos.y
          }
        });
      } else if (clickCount.current === 2) {
        // Double click - navigate to structure
                 console.log('Double click on model:', modelName, 'navigating to structure');
         console.log('Available navigation options:', {
           onModelDoubleClick: !!onModelDoubleClick,
           AdminRouter: !!window.AdminRouter,
           navigateToModel: !!window.AdminRouter?.navigateToModel
         });
         
         if (onModelDoubleClick) {
           console.log('Using onModelDoubleClick callback');
           onModelDoubleClick(modelName);
         } else {
           console.log('Using fallback navigation');
           if (window.AdminRouter && window.AdminRouter.navigateToModel) {
             console.log('Using AdminRouter.navigateToModel for:', modelName);
             window.AdminRouter.navigateToModel(modelName, 'structure');
           } else {
             console.log('AdminRouter not available, using direct URL change');
             window.location.href = `/ufo-studio/model/${modelName}/structure`;
           }
         }
      }
      
      clickCount.current = 0;
    }, 300);
  };

  // Mouse down handler for drag preparation
  const handleMouseDown = (e, modelName) => {
    // This is only for drag preparation, actual click handling is in handleModelClick
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    const modelPos = modelPositions[modelName];
    
    setDragState({
      isDragging: true,
      model: modelName,
      offset: {
        x: x - modelPos.x,
        y: y - modelPos.y
      }
    });
  };
    
    // Pan handlers for dragging the view
    const handleBackgroundMouseDown = useCallback((e) => {
        // Only start panning if clicking on background (not on a model)
        if (e.target.closest('.model-group')) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        setIsPanning(true);
        setPanStart({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.preventDefault();
    }, []);
    
    const handlePanMove = useCallback((e) => {
        if (!isPanning) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const deltaX = currentX - panStart.x;
        const deltaY = currentY - panStart.y;
        
        setPan(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));
        
        setPanStart({ x: currentX, y: currentY });
    }, [isPanning, panStart]);
    
    const handleMouseMove = useCallback((e) => {
        // Handle model dragging
        if (dragState.isDragging && dragState.model) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;
            
            setModelPositions(prev => ({
                ...prev,
                [dragState.model]: {
                    x: x - dragState.offset.x,
                    y: y - dragState.offset.y
                }
            }));
            return;
        }
        
        // Handle view panning
        if (isPanning) {
            handlePanMove(e);
        }
    }, [dragState, pan, zoom, isPanning, handlePanMove]);
    
    const handleMouseUp = useCallback(() => {
        setDragState({ isDragging: false, model: null, offset: { x: 0, y: 0 } });
        setIsPanning(false);
    }, []);
    
    // Zoom and pan handlers
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, zoom * delta));
        setZoom(newZoom);
    };
    
    // Reset view
    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);
    
    // Auto-layout models
    const autoLayout = useCallback(() => {
        setModelPositions(calculateInitialPositions());
    }, [calculateInitialPositions]);
    

    
    // Add event listeners
    useEffect(() => {
        if (dragState.isDragging || isPanning) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging, isPanning, handleMouseMove, handleMouseUp]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeout.current) {
                clearTimeout(clickTimeout.current);
            }
        };
    }, []);
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        fitToScreen();
                    }
                    break;
                case '=':
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setZoom(prev => Math.min(3, prev * 1.2));
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setZoom(prev => Math.max(0.1, prev / 1.2));
                    }
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        resetView();
                    }
                    break;
                case 'l':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        autoLayout();
                    }
                    break;
                case 'Escape':
                    setSelectedModel(null);
                    break;
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [fitToScreen, resetView, autoLayout]);
    
    // Render model box
    const renderModel = (model) => {
        const position = modelPositions[model.name];
        if (!position) return null;
        
        const isSelected = selectedModel === model.name;
        const fieldCount = model.fields?.length || 0;
        const relationCount = model.fields?.filter(field => {
            const fieldType = window.getFieldType ? window.getFieldType(field, schema) : 'string';
            return fieldType === 'relation';
        }).length || 0;
        
        const boxHeight = Math.max(100, 60 + Math.min(fieldCount, 8) * 16);
        const boxWidth = Math.max(180, model.name.length * 10 + 60);
        
        return h('g', {
            key: model.name,
            transform: `translate(${position.x}, ${position.y})`,
            className: 'model-group cursor-pointer',
            onMouseDown: (e) => handleMouseDown(e, model.name),
            onClick: (e) => handleModelClick(e, model.name)
        }, [
            // Drop shadow
            h('rect', {
                key: 'shadow',
                x: -boxWidth / 2 + 2,
                y: -boxHeight / 2 + 2,
                width: boxWidth,
                height: boxHeight,
                fill: 'rgba(0,0,0,0.1)',
                rx: 12
            }),
            
            // Model box background
            h('rect', {
                key: 'box-bg',
                x: -boxWidth / 2,
                y: -boxHeight / 2,
                width: boxWidth,
                height: boxHeight,
                fill: 'url(#modelGradient)',
                stroke: 'none',
                rx: 12
            }),
            
            // Model box border
            h('rect', {
                key: 'box',
                x: -boxWidth / 2,
                y: -boxHeight / 2,
                width: boxWidth,
                height: boxHeight,
                fill: 'none',
                stroke: isSelected ? '#2563eb' : '#e5e7eb',
                strokeWidth: isSelected ? 3 : 2,
                rx: 12,
                className: 'transition-all duration-200 hover:stroke-blue-400'
            }),
            
            // Header section
            h('rect', {
                key: 'header',
                x: -boxWidth / 2,
                y: -boxHeight / 2,
                width: boxWidth,
                height: 40,
                fill: isSelected ? '#3b82f6' : '#f8fafc',
                stroke: 'none',
                rx: 12,
                ry: 12
            }),
            h('rect', {
                key: 'header-bottom',
                x: -boxWidth / 2,
                y: -boxHeight / 2 + 28,
                width: boxWidth,
                height: 12,
                fill: isSelected ? '#3b82f6' : '#f8fafc',
                stroke: 'none'
            }),
            
            // Table icon
            h('text', {
                key: 'icon',
                x: -boxWidth / 2 + 16,
                y: -boxHeight / 2 + 26,
                className: `text-sm ${isSelected ? 'fill-white' : 'fill-blue-600'}`,
                style: { userSelect: 'none', fontFamily: 'FontAwesome' }
            }, '\uf0ce'), // table icon
            
            // Model name
            h('text', {
                key: 'name',
                x: -boxWidth / 2 + 36,
                y: -boxHeight / 2 + 26,
                className: `text-sm font-bold ${isSelected ? 'fill-white' : 'fill-gray-900'}`,
                style: { userSelect: 'none' }
            }, model.name),
            
            // Field count badge
            h('circle', {
                key: 'badge-bg',
                cx: boxWidth / 2 - 20,
                cy: -boxHeight / 2 + 20,
                r: 12,
                fill: isSelected ? '#1d4ed8' : '#3b82f6'
            }),
            h('text', {
                key: 'count',
                x: boxWidth / 2 - 20,
                y: -boxHeight / 2 + 25,
                textAnchor: 'middle',
                className: 'text-xs font-medium fill-white',
                style: { userSelect: 'none' }
            }, fieldCount),
            
            // Field list (first few fields)
            ...model.fields?.slice(0, 6).map((field, index) => {
                const fieldType = window.getFieldType ? window.getFieldType(field, schema) : 'string';
                const isPrimary = window.isPrimaryKey ? window.isPrimaryKey(field) : false;
                const yPos = -boxHeight / 2 + 55 + index * 16;
                
                return h('g', {
                    key: `field-${field.name}`
                }, [
                    // Field icon
                    h('text', {
                        key: 'field-icon',
                        x: -boxWidth / 2 + 12,
                        y: yPos,
                        className: `text-xs ${isPrimary ? 'fill-yellow-500' : fieldType === 'relation' ? 'fill-blue-500' : 'fill-gray-400'}`,
                        style: { userSelect: 'none', fontFamily: 'FontAwesome' }
                    }, isPrimary ? '\uf084' : fieldType === 'relation' ? '\uf0c1' : '\uf111'), // key, link, or circle
                    
                    // Field name
                    h('text', {
                        key: 'field-name',
                        x: -boxWidth / 2 + 28,
                        y: yPos,
                        className: `text-xs ${isPrimary ? 'font-semibold fill-gray-900' : 'fill-gray-700'}`,
                        style: { userSelect: 'none' }
                    }, field.name.length > 15 ? field.name.substring(0, 15) + '...' : field.name),
                    
                    // Field type
                    h('text', {
                        key: 'field-type',
                        x: boxWidth / 2 - 8,
                        y: yPos,
                        textAnchor: 'end',
                        className: 'text-xs fill-gray-500',
                        style: { userSelect: 'none' }
                    }, fieldType.substring(0, 3).toUpperCase())
                ]);
            }) || [],
            
            // More fields indicator
            fieldCount > 6 && h('text', {
                key: 'more-fields',
                x: 0,
                y: boxHeight / 2 - 12,
                textAnchor: 'middle',
                className: 'text-xs fill-gray-500',
                style: { userSelect: 'none' }
            }, `... +${fieldCount - 6} more fields`),
            
            // Relationship indicator
            relationCount > 0 && h('g', {
                key: 'relation-indicator'
            }, [
                h('circle', {
                    key: 'relation-bg',
                    cx: -boxWidth / 2 + 20,
                    cy: boxHeight / 2 - 20,
                    r: 8,
                    fill: '#10b981'
                }),
                h('text', {
                    key: 'relation-count',
                    x: -boxWidth / 2 + 20,
                    y: boxHeight / 2 - 16,
                    textAnchor: 'middle',
                    className: 'text-xs font-medium fill-white',
                    style: { userSelect: 'none' }
                }, relationCount)
            ])
        ]);
    };
    
    // Render relationship line with Crow's Foot notation
    const renderRelationship = (relationship) => {
        const fromPos = modelPositions[relationship.from];
        const toPos = modelPositions[relationship.to];
        
        if (!fromPos || !toPos) return null;
        
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return null;
        
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        const boxSize = 75;
        const startX = fromPos.x + unitX * boxSize;
        const startY = fromPos.y + unitY * boxSize;
        const endX = toPos.x - unitX * boxSize;
        const endY = toPos.y - unitY * boxSize;
        
        const strokeColor = relationship.isOptional ? '#94a3b8' : '#4f46e5';
        const strokeWidth = 2;
        
        // Crow's Foot notation: perpendicular vectors (rotate unit 90°)
        const perpX = -unitY;
        const perpY = unitX;
        const prongLength = 8;
        const crowFootSpread = 4;
        
        const elements = [];
        
        // Main relationship line
        elements.push(h('line', {
            key: 'line',
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: relationship.isOptional ? '5,5' : 'none',
            className: 'transition-all duration-200 hover:stroke-blue-600 cursor-pointer',
            onClick: () => onRelationshipClick(relationship)
        }));
        
        // FROM end: "one" side has single perpendicular line (|), "many" side has crow's foot (|<)
        if (relationship.isArray) {
            // From has many → crow's foot at start
            const p1x = startX + perpX * crowFootSpread;
            const p1y = startY + perpY * crowFootSpread;
            const p2x = startX - perpX * crowFootSpread;
            const p2y = startY - perpY * crowFootSpread;
            const tipX = startX + unitX * prongLength;
            const tipY = startY + unitY * prongLength;
            elements.push(h('path', {
                key: 'from-crowfoot',
                d: `M ${p1x} ${p1y} L ${tipX} ${tipY} L ${p2x} ${p2y}`,
                fill: 'none',
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
            }));
        } else {
            // From has one → single perpendicular line at start
            const p1x = startX + perpX * prongLength;
            const p1y = startY + perpY * prongLength;
            const p2x = startX - perpX * prongLength;
            const p2y = startY - perpY * prongLength;
            elements.push(h('line', {
                key: 'from-one',
                x1: p1x, y1: p1y, x2: p2x, y2: p2y,
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                strokeLinecap: 'round'
            }));
        }
        
        // Optional: circle at from end
        if (relationship.isOptional) {
            elements.push(h('circle', {
                key: 'from-optional',
                cx: startX,
                cy: startY,
                r: 5,
                fill: 'none',
                stroke: strokeColor,
                strokeWidth: strokeWidth
            }));
        }
        
        // TO end: opposite of from (many has crow's foot, one has perpendicular)
        if (relationship.isArray) {
            // To has one → single perpendicular line at end
            const p1x = endX + perpX * prongLength;
            const p1y = endY + perpY * prongLength;
            const p2x = endX - perpX * prongLength;
            const p2y = endY - perpY * prongLength;
            elements.push(h('line', {
                key: 'to-one',
                x1: p1x, y1: p1y, x2: p2x, y2: p2y,
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                strokeLinecap: 'round'
            }));
        } else {
            // To has many → crow's foot at end
            const p1x = endX + perpX * crowFootSpread;
            const p1y = endY + perpY * crowFootSpread;
            const p2x = endX - perpX * crowFootSpread;
            const p2y = endY - perpY * crowFootSpread;
            const tipX = endX - unitX * prongLength;
            const tipY = endY - unitY * prongLength;
            elements.push(h('path', {
                key: 'to-crowfoot',
                d: `M ${p1x} ${p1y} L ${tipX} ${tipY} L ${p2x} ${p2y}`,
                fill: 'none',
                stroke: strokeColor,
                strokeWidth: strokeWidth,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
            }));
        }
        
        // Relationship label (field name)
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const labelOffset = 12;
        elements.push(h('text', {
            key: 'label',
            x: midX + perpX * labelOffset,
            y: midY + perpY * labelOffset,
            textAnchor: 'middle',
            className: 'text-xs fill-gray-600 pointer-events-none',
            style: { fontFamily: 'system-ui, sans-serif', fontSize: '10px' }
        }, relationship.field));
        
        return h('g', {
            key: `${relationship.from}-${relationship.to}-${relationship.field}`,
            className: 'transition-all duration-200 hover:opacity-100 cursor-pointer',
            onClick: () => onRelationshipClick(relationship)
        }, elements);
    };
    
    const relationships = getRelationships();
    
    if (!models || models.length === 0) {
        return h('div', {
            className: 'flex items-center justify-center h-96 text-gray-500'
        }, [
            h('div', {
                className: 'text-center'
            }, [
                h('i', {
                    className: 'fas fa-project-diagram text-4xl mb-4'
                }),
                h('p', {}, 'No models found in schema')
            ])
        ]);
    }
    
    return h('div', {
        ref: containerRef,
        className: `relative border border-primary rounded-lg overflow-hidden ${className}`,
        style: { height, width }
    }, [
        // Controls
        h('div', {
            key: 'controls',
            className: 'absolute top-4 left-4 z-10 flex flex-wrap gap-2'
        }, [
            // Zoom Controls
            h('div', {
                key: 'zoom-group',
                className: 'flex rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden'
            }, [
                h(window.UIComponents.Button, {
                    key: 'zoom-out',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: () => setZoom(prev => Math.max(0.1, prev / 1.2)),
                    icon: 'fas fa-minus',
                    title: 'Zoom Out',
                    className: 'rounded-none border-0'
                }),
                h('div', {
                    key: 'zoom-display',
                    className: 'px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border-x border-gray-300 flex items-center min-w-[50px] justify-center'
                }, `${Math.round(zoom * 100)}%`),
                h(window.UIComponents.Button, {
                    key: 'zoom-in',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: () => setZoom(prev => Math.min(3, prev * 1.2)),
                    icon: 'fas fa-plus',
                    title: 'Zoom In',
                    className: 'rounded-none border-0'
                })
            ]),
            
            // Layout Controls
            h('div', {
                key: 'layout-group',
                className: 'flex space-x-1'
            }, [
                h(window.UIComponents.Button, {
                    key: 'fit-screen',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: fitToScreen,
                    icon: 'fas fa-expand-arrows-alt',
                    title: 'Fit to Screen'
                }),
                h(window.UIComponents.Button, {
                    key: 'auto-layout',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: autoLayout,
                    icon: 'fas fa-magic',
                    title: 'Auto Layout'
                }),
                h(window.UIComponents.Button, {
                    key: 'reset',
                    size: 'sm',
                    variant: 'secondary',
                    onClick: resetView,
                    icon: 'fas fa-home',
                    title: 'Reset View'
                })
            ])
        ]),
        
        // Help Toggle FAB
        h('div', {
            key: 'help-fab',
            className: 'absolute bottom-4 right-4 z-20'
        }, [
            h(window.UIComponents.Button, {
                key: 'help-toggle',
                size: 'md',
                variant: showHelp ? 'primary' : 'secondary',
                onClick: () => setShowHelp(!showHelp),
                icon: 'fas fa-question',
                title: showHelp ? 'Hide Help' : 'Show Help',
                className: 'rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200'
            })
        ]),
        
        // SVG Canvas
        h('svg', {
            key: 'canvas',
            ref: svgRef,
            width: '100%',
            height: '100%',
            className: `bg-gradient-to-br from-gray-50 to-gray-100 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`,
            onWheel: handleWheel,
            onMouseDown: handleBackgroundMouseDown
        }, [
            // Gradients and patterns
            h('defs', {
                key: 'defs'
            }, [
                h('linearGradient', {
                    key: 'modelGradient',
                    id: 'modelGradient',
                    x1: '0%',
                    y1: '0%',
                    x2: '0%',
                    y2: '100%'
                }, [
                    h('stop', {
                        key: 'stop1',
                        offset: '0%',
                        stopColor: '#ffffff',
                        stopOpacity: '1'
                    }),
                    h('stop', {
                        key: 'stop2',
                        offset: '100%',
                        stopColor: '#f8fafc',
                        stopOpacity: '1'
                    })
                ]),
                h('pattern', {
                    key: 'grid',
                    id: 'grid',
                    width: '20',
                    height: '20',
                    patternUnits: 'userSpaceOnUse'
                }, [
                    h('path', {
                        key: 'gridPath',
                        d: 'M 20 0 L 0 0 0 20',
                        fill: 'none',
                        stroke: '#e5e7eb',
                        strokeWidth: '0.5'
                    })
                ])
            ]),
            
            // Grid background
            h('rect', {
                key: 'grid-bg',
                width: '100%',
                height: '100%',
                fill: 'url(#grid)'
            }),
            // Main group with zoom and pan
            h('g', {
                key: 'main',
                transform: `translate(${pan.x}, ${pan.y}) scale(${zoom})`
            }, [
                // Relationships (drawn first, behind models)
                h('g', {
                    key: 'relationships'
                }, relationships.map(renderRelationship)),
                
                // Models
                h('g', {
                    key: 'models'
                }, models.map(renderModel))
            ])
        ]),
        
        // Status bar
        h('div', {
            key: 'status',
            className: 'absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200'
        }, [
            h('div', {
                className: 'flex items-center space-x-4 text-xs text-gray-600'
            }, [
                h('div', {
                    key: 'models-count',
                    className: 'flex items-center'
                }, [
                    h('i', { className: 'fas fa-table text-blue-500 mr-1' }),
                    h('span', { className: 'font-medium' }, models.length),
                    h('span', { className: 'text-gray-500 ml-1' }, 'models')
                ]),
                h('div', {
                    key: 'relations-count',
                    className: 'flex items-center'
                }, [
                    h('i', { className: 'fas fa-link text-green-500 mr-1' }),
                    h('span', { className: 'font-medium' }, relationships.length),
                    h('span', { className: 'text-gray-500 ml-1' }, 'relations')
                ]),
                selectedModel && h('div', {
                    key: 'selected-model',
                    className: 'flex items-center text-blue-600'
                }, [
                    h('i', { className: 'fas fa-crosshairs mr-1' }),
                    h('span', { className: 'font-medium' }, selectedModel)
                ])
            ])
        ]),
        
        // Help tooltip (conditionally rendered)
        showHelp && h('div', {
            key: 'help',
            className: 'absolute bottom-20 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-200 max-w-xs'
        }, [
            h('div', {
                className: 'text-xs text-gray-600'
            }, [
                h('div', { className: 'font-medium text-gray-900 mb-1 flex items-center' }, [
                    h('i', { className: 'fas fa-question-circle mr-1' }),
                    'Quick Help'
                ]),
                h('div', { className: 'space-y-1' }, [
                    h('div', { className: 'font-medium text-gray-700' }, 'Crow\'s Foot Notation:'),
                    h('div', {}, '• | = One (single perpendicular line)'),
                    h('div', {}, '• ⋈ = Many (crow\'s foot)'),
                    h('div', {}, '• ○ = Optional (circle)'),
                    h('div', { className: 'font-medium text-gray-700 mt-2' }, 'Mouse:'),
                    h('div', {}, '• Click models to select'),
                    h('div', {}, '• Double-click to view structure'),
                    h('div', {}, '• Drag models to reposition'),
                    h('div', {}, '• Drag background to pan view'),
                    h('div', {}, '• Scroll to zoom in/out'),
                    h('div', { className: 'font-medium text-gray-700 mt-2' }, 'Keyboard:'),
                    h('div', {}, '• Ctrl+0: Fit to screen'),
                    h('div', {}, '• Ctrl +/-: Zoom in/out'),
                    h('div', {}, '• Ctrl+R: Reset view'),
                    h('div', {}, '• ESC: Clear selection')
                ])
            ])
        ])
    ]);
};

// Export component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ERDiagram: window.UIComponents.ERDiagram
    };
} 