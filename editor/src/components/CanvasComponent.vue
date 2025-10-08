<template>
  <div
      ref="wrapper"
      class="flex-1 h-full min-w-0 relative overflow-hidden"
      :style="wrapperStyle"
      @dragover.prevent
      @drop="handleDrop"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
  >
    <canvas ref="cnv" class="block w-full h-full"/>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { fabric } from 'fabric'
import { ElementRegistry } from '../elements'
import type { ElementType } from '../elements'
import { setCanvas } from '../composables/useCanvas'
import { useEditorStore } from '../store/editor'

const emit = defineEmits<{ (e: 'update:selectedObject', obj: fabric.Object | null): void }>()
const wrapper = ref<HTMLElement>()
const cnv = ref<HTMLCanvasElement>()
let canvas!: fabric.Canvas

const editor = useEditorStore()
const wrapperStyle = computed(() => {
  if (!editor.gridEnabled) return {}
  const size = editor.gridSize
  const color = editor.gridColor
  return {
    backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`
  }
})

let isPanning = false
let isDragging = false
let lastPos = { x: 0, y: 0 }
let altPressed = false

function onSpaceDown(e: KeyboardEvent) {
  if (e.code !== 'Space' || isPanning) return
  isPanning = true
  canvas.selection = false
  canvas.defaultCursor = 'grab'
  e.preventDefault()
}

function onSpaceUp(e: KeyboardEvent) {
  if (e.code !== 'Space') return
  isPanning = false
  isDragging = false
  canvas.selection = true
  canvas.defaultCursor = 'default'
  e.preventDefault()
}

function onMouseDown(e: MouseEvent) {
  if (!isPanning) return
  isDragging = true
  canvas.defaultCursor = 'grabbing'
  lastPos = { x: e.clientX, y: e.clientY }
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isPanning || !isDragging) return
  const vpt = canvas.viewportTransform!
  const dx = e.clientX - lastPos.x
  const dy = e.clientY - lastPos.y
  vpt[4] += dx
  vpt[5] += dy
  canvas.requestRenderAll()
  lastPos = { x: e.clientX, y: e.clientY }
}

function onMouseUp() {
  if (!isPanning) return
  isDragging = false
  canvas.defaultCursor = 'grab'
}

function onAltDown(e: KeyboardEvent) {
  if (e.key === 'Alt') altPressed = true
}

function onAltUp(e: KeyboardEvent) {
  if (e.key === 'Alt') altPressed = false
}

watch(() => editor.zoom, value => {
  if (!canvas) return
  const center = canvas.getCenter()
  canvas.zoomToPoint(new fabric.Point(center.left, center.top), value)
}, {immediate: true})

watch(() => editor.mode, mode => {
  if (!canvas) return
  const runtime = mode === 'runtime'
  canvas.selection = !runtime
  canvas.skipTargetFind = runtime
  canvas.forEachObject(obj => {
    const isLocked = !!(obj.lockMovementX && obj.lockMovementY)
    obj.selectable = runtime ? false : !isLocked
    obj.evented = runtime ? false : !isLocked
  })
  if (runtime) {
    canvas.discardActiveObject()
    editor.setSelection({count: 0, isGroup: false, isCanvas: true})
  }
  canvas.requestRenderAll()
}, {immediate: true})

function handleDrop(e: DragEvent) {
  e.preventDefault()
  if (editor.isRuntime) return
  const type = e.dataTransfer?.getData('shape') as ElementType | undefined
  if (!type) return

  const pointer = canvas.getPointer(e as unknown as MouseEvent)

  if (type === 'image') {
    const picker = document.createElement('input')
    picker.type = 'file'
    picker.accept = 'image/png,image/jpeg'
    picker.onchange = () => {
      const file = picker.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        const src = ev.target?.result as string
        const Ctor = ElementRegistry.image
        new Ctor(canvas, pointer.x, pointer.y, { src })
      }
      reader.readAsDataURL(file)
    }
    picker.click()
    return
  }

  const Ctor = ElementRegistry[type]
  new Ctor(canvas, pointer.x, pointer.y)
}

const undoStack: string[] = []
const redoStack: string[] = []

function snapshot() {
  undoStack.push(
      JSON.stringify(canvas.toJSON(['id', 'customProps', 'elementType', 'bindings', 'meta']))
  )
  if (undoStack.length > 50) undoStack.shift()
  redoStack.length = 0
}

function loadState(json: any) {
  canvas.clear()
  fabric.util.enlivenObjects(json.objects, (objs: fabric.Object[]) => {
    objs.forEach((o: fabric.Object) => canvas.add(o))
    canvas.renderAll()
  }, 'fabric')
}

let clipboard: fabric.Object[] = []

function copySelection() {
  clipboard = canvas.getActiveObjects().map(o => o)
}

function pasteClipboard() {
  clipboard.forEach(source => {
    source.clone((clone: fabric.Object | null) => {
      if (!clone) return
      clone.set({
        left: (clone.left ?? 0) + 20,
        top: (clone.top ?? 0) + 20
      })
      ;(clone as any).id = crypto.randomUUID()
      canvas.add(clone)
      canvas.setActiveObject(clone)
      canvas.requestRenderAll()
    }, ['id', 'customProps', 'elementType', 'bindings', 'meta'])
  })
}

function deleteSelection() {
  const items = canvas.getActiveObjects()
  items.forEach(obj => {
    obj.animate('opacity', '0', {
      duration: 200,
      onChange: canvas.renderAll.bind(canvas),
      onComplete: () => {
        canvas.remove(obj)
      }
    })
  })
  canvas.discardActiveObject()
}

function handleKey(e: KeyboardEvent) {
  if (!canvas || e.code === 'Space') return
  const mod = e.ctrlKey || e.metaKey
  const shift = e.shiftKey

  if (e.code === 'Delete' || e.code === 'Backspace') {
    deleteSelection()
    e.preventDefault()
    return
  }
  if (mod && e.code === 'KeyC') {
    copySelection()
    e.preventDefault()
    return
  }
  if (mod && e.code === 'KeyV') {
    pasteClipboard()
    e.preventDefault()
    return
  }
  if (mod && !shift && e.code === 'KeyZ') {
    if (undoStack.length > 1) {
      const current = undoStack.pop()!
      redoStack.push(current)
      loadState(JSON.parse(undoStack[undoStack.length - 1]))
    }
    e.preventDefault()
    return
  }
  if ((mod && shift && e.code === 'KeyZ') || (mod && e.code === 'KeyY')) {
    if (redoStack.length) {
      const next = redoStack.pop()!
      undoStack.push(next)
      loadState(JSON.parse(next))
    }
    e.preventDefault()
  }
}

onMounted(() => {
  canvas = new fabric.Canvas(cnv.value!, { selection: true })
  setCanvas(canvas, { snapshot })
  const ro = new ResizeObserver(entries => {
    const r = entries[0].contentRect
    canvas.setDimensions({ width: r.width, height: r.height })
  })
  ro.observe(wrapper.value!)
  const updateSelection = () => {
    const active = canvas.getActiveObject() as any
    if (!active) {
      editor.setSelection({count: 0, isGroup: false, isCanvas: true})
      emit('update:selectedObject', null)
      return
    }
    let count = 1
    if (active.type === 'activeSelection') {
      count = (active._objects?.length ?? 0)
    }
    if (active.type === 'group') {
      count = (active._objects?.length ?? 0)
    }
    editor.setSelection({count, isGroup: active.type === 'group', isCanvas: false})
    emit('update:selectedObject', active)
  }
  canvas.on('selection:created', updateSelection)
  canvas.on('selection:updated', updateSelection)
  canvas.on('selection:cleared', () => {
    editor.setSelection({count: 0, isGroup: false, isCanvas: true})
    emit('update:selectedObject', null)
  })
  canvas.on('object:added', snapshot)
  canvas.on('object:modified', snapshot)
  canvas.on('object:removed', snapshot)
  canvas.on('object:moving', e => {
    if (!editor.snapEnabled || altPressed) return
    const target = e.target
    if (!target) return
    const grid = editor.gridSize
    if (!grid) return
    target.set({
      left: Math.round((target.left ?? 0) / grid) * grid,
      top: Math.round((target.top ?? 0) / grid) * grid
    })
  })
  snapshot()
  window.addEventListener('keydown', onSpaceDown)
  window.addEventListener('keyup', onSpaceUp)
  window.addEventListener('keydown', handleKey)
  window.addEventListener('keydown', onAltDown)
  window.addEventListener('keyup', onAltUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onSpaceDown)
  window.removeEventListener('keyup', onSpaceUp)
  window.removeEventListener('keydown', handleKey)
  window.removeEventListener('keydown', onAltDown)
  window.removeEventListener('keyup', onAltUp)
})
</script>
