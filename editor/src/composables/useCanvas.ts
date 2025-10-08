import {ref} from 'vue'
import type {fabric} from 'fabric'


const canvas = ref<fabric.Canvas | null>(null)
const snapshotHandler = ref<(() => void) | null>(null)


export function setCanvas(c: fabric.Canvas, helpers?: { snapshot?: () => void }) {
    canvas.value = c
    snapshotHandler.value = helpers?.snapshot ?? null
}

export function useCanvas() {
    return {
        canvas,
        snapshot: () => snapshotHandler.value?.()
    }
}
