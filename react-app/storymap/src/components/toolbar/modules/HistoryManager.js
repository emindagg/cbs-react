export class HistoryManager {
    constructor(toolbarElement) {
        this.toolbar = toolbarElement;
        this.sidebarComponent = null;
        this.mapComponent = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
    }

    setComponents(sidebarComponent, mapComponent) {
        this.sidebarComponent = sidebarComponent;
        this.mapComponent = mapComponent;
        this.updateUndoRedoButtons();
    }

    addAction(action) {
        this.undoStack.push(action);
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        if (!this.toolbar) return;
        
        const undoBtn = this.toolbar.querySelector('[data-tool="undo"]');
        const redoBtn = this.toolbar.querySelector('[data-tool="redo"]');
        
        if (undoBtn) {
            if (this.undoStack.length === 0) {
                undoBtn.classList.add('toolbar__btn--disabled');
                undoBtn.disabled = true;
            } else {
                undoBtn.classList.remove('toolbar__btn--disabled');
                undoBtn.disabled = false;
            }
        }
        
        if (redoBtn) {
            if (this.redoStack.length === 0) {
                redoBtn.classList.add('toolbar__btn--disabled');
                redoBtn.disabled = true;
            } else {
                redoBtn.classList.remove('toolbar__btn--disabled');
                redoBtn.disabled = false;
            }
        }
    }

    undo() {
        if (this.undoStack.length === 0) return;
        
        const action = this.undoStack.pop();
        this.executeUndo(action);
        this.redoStack.push(action);
        this.updateUndoRedoButtons();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        
        const action = this.redoStack.pop();
        this.executeRedo(action);
        this.undoStack.push(action);
        this.updateUndoRedoButtons();
    }

    executeUndo(action) {
        if (!this.sidebarComponent) return;

        switch (action.type) {
            case 'add_point':
            case 'add_drawing':
                const point = this.sidebarComponent.points.find(p => p.id === action.data.id);
                if (point && point.marker) {
                    point.marker.remove();
                }
                if (action.data.mapLayerId && this.mapComponent && this.mapComponent.map) {
                    const map = this.mapComponent.map;
                    if (map.getLayer(`${action.data.mapLayerId}-layer`)) map.removeLayer(`${action.data.mapLayerId}-layer`);
                    if (map.getLayer(`${action.data.mapLayerId}-outline`)) map.removeLayer(`${action.data.mapLayerId}-outline`);
                    if (map.getSource(action.data.mapLayerId)) map.removeSource(action.data.mapLayerId);
                }
                this.sidebarComponent.removePoint(action.data.id);
                break;
                
            case 'delete_point':
                this.sidebarComponent.points.push(action.data);
                if (action.data.coords && this.mapComponent) {
                    const newMarker = this.mapComponent.addMarker(action.data.coords, {
                        color: action.data.color,
                        icon: action.data.icon,
                        isNumber: action.data.isNumber,
                        number: action.data.number,
                        shape: action.data.shape
                    });
                    action.data.marker = newMarker;
                }
                this.sidebarComponent.updatePointsList();
                break;
                
            case 'edit_point':
                const pointIndex = this.sidebarComponent.points.findIndex(p => p.id === action.data.id);
                if (pointIndex > -1) {
                    this.sidebarComponent.points[pointIndex] = { ...action.data.oldValues };
                    this.sidebarComponent.updatePointsList();
                }
                break;
        }
    }

    executeRedo(action) {
        if (!this.sidebarComponent) return;

        switch (action.type) {
            case 'add_point':
            case 'add_drawing':
                this.sidebarComponent.points.push(action.data);
                if (action.data.coords && this.mapComponent) {
                    const newMarker = this.mapComponent.addMarker(action.data.coords, {
                        color: action.data.color,
                        icon: action.data.icon,
                        isNumber: action.data.isNumber,
                        number: action.data.number,
                        shape: action.data.shape
                    });
                    action.data.marker = newMarker;
                }
                this.sidebarComponent.updatePointsList();
                break;
                
            case 'delete_point':
                const point = this.sidebarComponent.points.find(p => p.id === action.data.id);
                if (point && point.marker) {
                    point.marker.remove();
                }
                this.sidebarComponent.removePoint(action.data.id);
                break;
                
            case 'edit_point':
                const pointIndex = this.sidebarComponent.points.findIndex(p => p.id === action.data.id);
                if (pointIndex > -1) {
                    this.sidebarComponent.points[pointIndex] = { ...action.data.newValues };
                    this.sidebarComponent.updatePointsList();
                }
                break;
        }
    }
}
