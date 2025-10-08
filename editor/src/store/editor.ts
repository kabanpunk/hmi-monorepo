import {defineStore} from 'pinia'

export type EditorMode = 'design' | 'runtime'

export interface SelectionInfo {
    count: number
    isGroup: boolean
    isCanvas: boolean
}

const LOCAL_KEY = 'hmi-editor-settings'

interface PersistedState {
    gridEnabled: boolean
    snapEnabled: boolean
    gridSize: number
    gridColor: string
    zoom: number
    lastAlign: string
    lastDistribute: string
}

function loadPersisted(): PersistedState | null {
    try {
        const raw = localStorage.getItem(LOCAL_KEY)
        return raw ? JSON.parse(raw) as PersistedState : null
    } catch (_) {
        return null
    }
}

function persist(state: PersistedState) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
    } catch (_) {
        /* noop */
    }
}

const defaults: PersistedState = {
    gridEnabled: true,
    snapEnabled: true,
    gridSize: 20,
    gridColor: 'rgba(160,160,160,0.25)',
    zoom: 1,
    lastAlign: 'left',
    lastDistribute: 'horizontal-centers'
}

export const useEditorStore = defineStore('editor', {
    state: () => {
        const persisted = loadPersisted()
        return {
            mode: 'design' as EditorMode,
            gridEnabled: persisted?.gridEnabled ?? defaults.gridEnabled,
            snapEnabled: persisted?.snapEnabled ?? defaults.snapEnabled,
            gridSize: persisted?.gridSize ?? defaults.gridSize,
            gridColor: persisted?.gridColor ?? defaults.gridColor,
            zoom: persisted?.zoom ?? defaults.zoom,
            lastAlign: persisted?.lastAlign ?? defaults.lastAlign,
            lastDistribute: persisted?.lastDistribute ?? defaults.lastDistribute,
            selection: {count: 0, isGroup: false, isCanvas: true} as SelectionInfo
        }
    },
    getters: {
        isRuntime: s => s.mode === 'runtime',
        canAlign: s => s.selection.count >= 2,
        canDistribute: s => s.selection.count >= 3,
        canResize: s => s.selection.count >= 1,
        canGroup: s => s.selection.count >= 2,
        canUngroup: s => s.selection.isGroup
    },
    actions: {
        setMode(m: EditorMode) {
            this.mode = m
        },
        setSelection(info: SelectionInfo) {
            this.selection = info
        },
        setGridEnabled(val: boolean) {
            this.gridEnabled = val
            this.persist()
        },
        setSnapEnabled(val: boolean) {
            this.snapEnabled = val
            this.persist()
        },
        setGridSize(size: number) {
            this.gridSize = size
            this.persist()
        },
        setGridColor(color: string) {
            this.gridColor = color
            this.persist()
        },
        setZoom(value: number) {
            this.zoom = value
            this.persist()
        },
        setLastAlign(action: string) {
            this.lastAlign = action
            this.persist()
        },
        setLastDistribute(action: string) {
            this.lastDistribute = action
            this.persist()
        },
        persist() {
            persist({
                gridEnabled: this.gridEnabled,
                snapEnabled: this.snapEnabled,
                gridSize: this.gridSize,
                gridColor: this.gridColor,
                zoom: this.zoom,
                lastAlign: this.lastAlign,
                lastDistribute: this.lastDistribute
            })
        }
    }
})
