import {ref} from 'vue'
import type {Canvas} from 'fabric'


const canvas = ref<Canvas | null>(null)


export function setCanvas(c: Canvas) {
    canvas.value = c
}

export function useCanvas() {
    return {canvas}
}
