import React, { useState, useRef, useEffect } from 'react';
import { 
  Move, 
  RotateCw, 
  Image as ImageIcon, 
  Pencil, 
  Save, 
  Trash2,
  Square,
  Circle,
  Triangle,
  Palette,
  PaintBucket,
  Undo,
  Redo
} from 'lucide-react';

type Tool = 'move' | 'draw' | 'image' | 'rectangle' | 'circle' | 'triangle';

interface Element {
  id: string;
  type: 'path' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  path?: { x: number; y: number; color?: string; size?: number }[];  // Added size to path points
  src?: string;
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  startX?: number;
  startY?: number;
  color: string;
  fill?: boolean;
  penSize?: number;  // Added penSize property
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', 
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800',
  '#88FF00', '#0088FF', '#FF0088', '#8800FF'
];

export default function CollaborativeCanvas() {
    const [tool, setTool] = useState<Tool>('move');
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedElement, setSelectedElement] = useState<Element | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number; color: string; size: number }[]>([]);
    const [fillMode, setFillMode] = useState(false);
    const [undoStack, setUndoStack] = useState<Element[][]>([]);
    const [redoStack, setRedoStack] = useState<Element[][]>([]);
    const [resizing, setResizing] = useState<{ 
      handle: string; 
      element: Element;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    } | null>(null);
    const [dragging, setDragging] = useState<{ 
      element: Element; 
      offsetX: number; 
      offsetY: number 
    } | null>(null);
    const [creating, setCreating] = useState<{
      type: string;
      startX: number;
      startY: number;
    } | null>(null);
    const [currentColor, setCurrentColor] = useState('#000000');
    const [showColorPicker, setShowColorPicker] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [penSize, setPenSize] = useState(2);

    // Add element with undo support
    const addElement = (newElement: Element) => {
      setUndoStack(prev => [...prev, elements]);
      setRedoStack([]);
      setElements(prev => [...prev, newElement]);
    };

    // Update elements with undo support
    const updateElements = (newElements: Element[]) => {
      setUndoStack(prev => [...prev, elements]);
      setRedoStack([]);
      setElements(newElements);
    };

    const undo = () => {
      if (undoStack.length === 0) return;
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, elements]);
      setElements(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      setSelectedElement(null);
    };

    const redo = () => {
      if (redoStack.length === 0) return;
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, elements]);
      setElements(nextState);
      setRedoStack(prev => prev.slice(0, -1));
      setSelectedElement(null);
    };

    const saveCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Create temporary link element
      const link = document.createElement('a');
      link.download = 'canvas.png';
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };


    const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure || 1,  // Default to 1 if pressure not supported
            pointerType: e.pointerType // 'mouse', 'pen', or 'touch'
        };
    };

  const isPointInElement = (point: { x: number; y: number }, element: Element) => {
    const dx = point.x - element.x;
    const dy = point.y - element.y;
    return Math.abs(dx) <= element.width / 2 && Math.abs(dy) <= element.height / 2;
  };

  const getResizeHandle = (point: { x: number; y: number }, element: Element) => {
    const handles = [
      { name: 'nw', x: element.x - element.width/2, y: element.y - element.height/2 },
      { name: 'ne', x: element.x + element.width/2, y: element.y - element.height/2 },
      { name: 'se', x: element.x + element.width/2, y: element.y + element.height/2 },
      { name: 'sw', x: element.x - element.width/2, y: element.y + element.height/2 }
    ];

    for (const handle of handles) {
      if (Math.abs(point.x - handle.x) < 10 && Math.abs(point.y - handle.y) < 10) {
        return handle.name;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPos(e);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    if (tool === 'draw') {
        setIsDrawing(true);
        setCurrentPath([{ ...pos, color: currentColor, size: penSize }]);
        return;
    }

    if (['rectangle', 'circle', 'triangle'].includes(tool)) {
        const newElement: Element = {
            id: crypto.randomUUID(),
            type: 'shape',
            shapeType: tool as 'rectangle' | 'circle' | 'triangle',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            rotation: 0,
            startX: pos.x,
            startY: pos.y,
            color: currentColor,
            fill: fillMode  // Add fill property to new shapes
        };
        setElements(prev => [...prev, newElement]);
        setCreating({ type: tool, startX: pos.x, startY: pos.y });
        setSelectedElement(newElement);
        return;
    }

    // Check for resize handles first
    if (selectedElement) {
      const handle = getResizeHandle(pos, selectedElement);
      if (handle) {
        setResizing({
          handle,
          element: selectedElement,
          startX: pos.x,
          startY: pos.y,
          startWidth: selectedElement.width,
          startHeight: selectedElement.height
        });
        return;
      }
    }

    // Then check for element selection
    for (let i = elements.length - 1; i >= 0; i--) {
      if (isPointInElement(pos, elements[i])) {
        setSelectedElement(elements[i]);
        setDragging({
          element: elements[i],
          offsetX: pos.x - elements[i].x,
          offsetY: pos.y - elements[i].y
        });
        return;
      }
    }

    setSelectedElement(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPos(e);

    if (tool === 'draw' && isDrawing) {
        setCurrentPath(prev => [...prev, { ...pos, color: currentColor, size: penSize }]);
        return;
    }

    if (creating && selectedElement) {
      const width = Math.abs(pos.x - creating.startX);
      const height = Math.abs(pos.y - creating.startY);
      const x = creating.startX + (pos.x - creating.startX) / 2;
      const y = creating.startY + (pos.y - creating.startY) / 2;

      setElements(prev => prev.map(el =>
        el.id === selectedElement.id
          ? { ...el, width, height, x, y }
          : el
      ));
      return;
    }

    if (dragging) {
      setElements(prev => prev.map(el =>
        el.id === dragging.element.id
          ? { ...el, x: pos.x - dragging.offsetX, y: pos.y - dragging.offsetY }
          : el
      ));
      return;
    }

    if (resizing && selectedElement) {
      const dx = pos.x - resizing.startX;
      const dy = pos.y - resizing.startY;
      const aspect = resizing.startWidth / resizing.startHeight;

      let newWidth = resizing.startWidth;
      let newHeight = resizing.startHeight;

      switch (resizing.handle) {
        case 'se':
          newWidth = Math.max(20, resizing.startWidth + dx * 2);
          newHeight = Math.max(20, resizing.startHeight + dy * 2);
          break;
        case 'sw':
          newWidth = Math.max(20, resizing.startWidth - dx * 2);
          newHeight = Math.max(20, resizing.startHeight + dy * 2);
          break;
        case 'ne':
          newWidth = Math.max(20, resizing.startWidth + dx * 2);
          newHeight = Math.max(20, resizing.startHeight - dy * 2);
          break;
        case 'nw':
          newWidth = Math.max(20, resizing.startWidth - dx * 2);
          newHeight = Math.max(20, resizing.startHeight - dy * 2);
          break;
      }

      // Maintain aspect ratio for images
      if (selectedElement.type === 'image') {
        if (Math.abs(dx) > Math.abs(dy)) {
          newHeight = newWidth / aspect;
        } else {
          newWidth = newHeight * aspect;
        }
      }

      setElements(prev => prev.map(el =>
        el.id === selectedElement.id
          ? { ...el, width: newWidth, height: newHeight }
          : el
      ));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    
    if (isDrawing && currentPath.length > 0) {
        const newElement: Element = {
            id: crypto.randomUUID(),
            type: 'path',
            path: currentPath,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            color: currentColor,
            penSize: penSize
        };
        addElement(newElement);
        setCurrentPath([]);
        setIsDrawing(false);
    }
    setDragging(null);
    setResizing(null);
    setCreating(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const newElement: Element = {
            id: crypto.randomUUID(),
            type: 'image',
            src: event.target.result,
            x: canvasRef.current!.width / 2,
            y: canvasRef.current!.height / 2,
            width: img.width / 2,
            height: img.height / 2,
            rotation: 0,
            color: '#000000'  // Added to satisfy type
          };
          setElements(prev => [...prev, newElement]);
          setSelectedElement(newElement);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

        // First, draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);

        if (element.type === 'path' && element.path) {
            ctx.beginPath();
            ctx.strokeStyle = element.color || '#000000';
            ctx.lineWidth = element.penSize || 2;  // Use element's penSize
            element.path.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        }else if (element.type === 'image' && element.src) {
            const img = new Image();
            img.src = element.src;
            ctx.drawImage(
                img,
                -element.width / 2,
                -element.height / 2,
                element.width,
                element.height
            );
        } else if (element.type === 'shape') {
            ctx.strokeStyle = element.color || '#000000';
            ctx.fillStyle = element.color || '#000000';
            ctx.lineWidth = 2;

            switch (element.shapeType) {
                case 'rectangle':
                    if (element.fill) {
                        ctx.fillRect(
                            -element.width / 2,
                            -element.height / 2,
                            element.width,
                            element.height
                        );
                    }
                    ctx.strokeRect(
                        -element.width / 2,
                        -element.height / 2,
                        element.width,
                        element.height
                    );
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.ellipse(0, 0, element.width / 2, element.height / 2, 0, 0, Math.PI * 2);
                    if (element.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -element.height / 2);
                    ctx.lineTo(element.width / 2, element.height / 2);
                    ctx.lineTo(-element.width / 2, element.height / 2);
                    ctx.closePath();
                    if (element.fill) {
                        ctx.fill();
                    }
                    ctx.stroke();
                    break;
            }
        }

        // Draw selection and resize handles for selected element
        if (element === selectedElement) {
            ctx.strokeStyle = '#0066ff';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                -element.width / 2 - 5,
                -element.height / 2 - 5,
                element.width + 10,
                element.height + 10
            );
            ctx.setLineDash([]);

            // Draw resize handles
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#0066ff';
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(
                    x * element.width / 2,
                    y * element.height / 2,
                    5, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();
            });
        }

        ctx.restore();
    });

    if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = penSize;
        currentPath.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
}, [elements, selectedElement, currentPath, currentColor, penSize]);

    // Add keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
        };
  
        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
      }, [elements, undoStack, redoStack]);

      const colorPickerButton = (
        <div className="relative">
          {/* Color Picker Button */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-lg hover:bg-gray-100 flex items-center gap-1 transition-colors"
          >
            <Palette className="h-5 w-5 text-gray-700" />
            <div 
              className="w-6 h-6 rounded-full border border-gray-300" 
              style={{ backgroundColor: currentColor }}
            />
          </button>
      
          {/* Color Picker Dropdown */}
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg grid grid-cols-4 gap-1 z-20">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color);
                    setShowColorPicker(false);
                  }}
                  className="w-8 h-8 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
      
          {/* Pen Size Slider */}
          <div className="mt-2 w-full">
            <input
              type="range"
              min="1"
              max="10"
              value={penSize}
              onChange={(e) => setPenSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
      
          {/* Tooltip Hover Effect */}
          <div className="absolute top-0 left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Change Color (C)
          </div>
        </div>
      );
      



  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-16 border-r bg-white flex flex-col items-center py-4 gap-6 fixed left-0 h-full">
        {/* History Tools */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${undoStack.length === 0 ? 'opacity-50' : ''}`}
            >
              <Undo className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Undo (Ctrl+Z)
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${redoStack.length === 0 ? 'opacity-50' : ''}`}
            >
              <Redo className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Redo (Ctrl+Shift+Z)
            </div>
          </div>
        </div>

        <div className="w-8 h-px bg-gray-200" />

        {/* Drawing Tools */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setTool('move')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${tool === 'move' ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <Move className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Move Tool (V)
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={() => setTool('draw')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${tool === 'draw' ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <Pencil className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Draw Tool (B)
            </div>
          </div>
        </div>

        <div className="w-8 h-px bg-gray-200" />

        {/* Shapes */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${tool === 'rectangle' ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <Square className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Rectangle Tool (R)
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${tool === 'circle' ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <Circle className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Circle Tool (C)
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={() => setTool('triangle')}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${tool === 'triangle' ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <Triangle className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Triangle Tool (T)
            </div>
          </div>
        </div>

        <div className="w-8 h-px bg-gray-200" />

        {/* Additional Tools */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            <button
              onClick={() => setFillMode(!fillMode)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${fillMode ? 'bg-gray-100 ring-1 ring-gray-200' : ''}`}
            >
              <PaintBucket className="h-5 w-5" />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {fillMode ? "Fill enabled (F)" : "Fill disabled (F)"}
            </div>
          </div>
          <div className="relative group">
            <label className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer block">
              <ImageIcon className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Import Image
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-16">
        <div className="max-w-[1200px] mx-auto p-4">
          {/* Simple Color and Size Bar */}
          <div className="flex items-center gap-4 mb-4 bg-white p-2 rounded-lg">
            {/* Colors */}
            <div className="flex gap-1">
              {COLORS.map(color => (
                <div key={color} className="relative group">
                  <button
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full hover:scale-110 transition-transform ${currentColor === color ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'}`}
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {color === currentColor ? 'Current Color' : 'Select Color'}
                  </div>
                </div>
              ))}
            </div>

            {/* Pen Size */}
            <div className="relative group">
              <input
                type="range"
                min="1"
                max="10"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-32"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Pen Size: {penSize}px
              </div>
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-200 rounded-lg shadow-sm bg-white touch-none mx-auto"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          {/* Save Button - Fixed Position */}
          <div className="fixed bottom-4 right-4">
            <div className="relative group">
              <button 
                onClick={saveCanvas}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Save Canvas (Ctrl+S)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

);
}