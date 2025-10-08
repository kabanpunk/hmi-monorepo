<template>
  <div class="bg-white border-b shadow-sm" v-bind="$attrs">
    <div class="flex items-center gap-3 px-3 py-2 text-sm select-none">
      <!-- Text settings -->
      <n-popover trigger="click" placement="bottom-start" :disabled="!editor.canResize">
        <template #trigger>
          <n-button quaternary size="small" :disabled="!editor.canResize">Text</n-button>
        </template>
        <div class="w-72 space-y-3">
          <div class="grid grid-cols-2 gap-3 items-center">
            <span class="text-xs uppercase tracking-wide text-gray-500">Шрифт</span>
            <n-select
                size="small"
                :options="fontOptions"
                v-model:value="textState.fontFamily"
                @update:value="applyText"
            />
            <span class="text-xs uppercase tracking-wide text-gray-500">Размер</span>
            <n-input-number
                size="small"
                :min="6"
                :max="200"
                v-model:value="textState.fontSize"
                @blur="applyText"
                @keyup.enter="applyText"
            />
          </div>
          <div class="flex items-center gap-2">
            <n-button size="tiny" :type="textState.bold ? 'primary' : 'default'" @click="toggleText('bold')">B</n-button>
            <n-button size="tiny" :type="textState.italic ? 'primary' : 'default'" @click="toggleText('italic')"><i>I</i></n-button>
            <n-button size="tiny" :type="textState.underline ? 'primary' : 'default'" @click="toggleText('underline')"><u>U</u></n-button>
            <n-popover trigger="click" placement="bottom">
              <template #trigger>
                <n-button size="tiny" class="w-8" :style="{ backgroundColor: textState.fill }"></n-button>
              </template>
              <n-color-picker size="small" v-model:value="textState.fill" @update:value="applyText" />
            </n-popover>
            <div class="flex-1"></div>
            <n-button size="tiny" @click="setTextAlign('left')">L</n-button>
            <n-button size="tiny" @click="setTextAlign('center')">C</n-button>
            <n-button size="tiny" @click="setTextAlign('right')">R</n-button>
          </div>
          <div class="grid grid-cols-2 gap-3 items-center">
            <span class="text-xs uppercase tracking-wide text-gray-500">Межстрочный интервал</span>
            <n-input-number size="small" v-model:value="textState.lineHeight" :step="0.1" @blur="applyText" />
          </div>
        </div>
      </n-popover>

      <!-- Align -->
      <n-popover trigger="click" placement="bottom">
        <template #trigger>
          <n-button quaternary size="small" :disabled="!editor.canAlign">{{ alignLabel }}</n-button>
        </template>
        <div class="grid grid-cols-3 gap-1">
          <n-button tertiary size="tiny" @click="runAlign('left')">⬅</n-button>
          <n-button tertiary size="tiny" @click="runAlign('center-h')">↔</n-button>
          <n-button tertiary size="tiny" @click="runAlign('right')">➡</n-button>
          <n-button tertiary size="tiny" @click="runAlign('top')">⬆</n-button>
          <n-button tertiary size="tiny" @click="runAlign('center-v')">↕</n-button>
          <n-button tertiary size="tiny" @click="runAlign('bottom')">⬇</n-button>
        </div>
      </n-popover>

      <!-- Distribute -->
      <n-popover trigger="click" placement="bottom">
        <template #trigger>
          <n-button quaternary size="small" :disabled="!editor.canDistribute">Distribute</n-button>
        </template>
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-1">
            <n-button tertiary size="tiny" @click="runDistribute('horizontal-centers')">Центры X</n-button>
            <n-button tertiary size="tiny" @click="runDistribute('vertical-centers')">Центры Y</n-button>
            <n-button tertiary size="tiny" @click="runDistribute('horizontal-spacing')">Интервал X</n-button>
            <n-button tertiary size="tiny" @click="runDistribute('vertical-spacing')">Интервал Y</n-button>
          </div>
          <div class="grid grid-cols-[auto,1fr] items-center gap-2 text-xs text-gray-500">
            <span>Интервал</span>
            <n-input-number size="small" v-model:value="distributionSpacing" :min="0" :step="5" />
          </div>
        </div>
      </n-popover>

      <!-- Resize -->
      <n-popover trigger="click" placement="bottom">
        <template #trigger>
          <n-button quaternary size="small" :disabled="!editor.canResize">Resize</n-button>
        </template>
        <div class="space-y-2">
          <n-button tertiary size="tiny" block @click="matchSize('width')">Match Width</n-button>
          <n-button tertiary size="tiny" block @click="matchSize('height')">Match Height</n-button>
          <n-button tertiary size="tiny" block @click="matchSize('both')">Match Both</n-button>
          <div class="grid grid-cols-[auto,1fr] items-center gap-2 text-xs text-gray-500">
            <span>Абсолютно</span>
            <div class="flex gap-2 items-center">
              <n-input-number size="small" v-model:value="absoluteSize.width" :min="1" placeholder="W" />
              <n-input-number size="small" v-model:value="absoluteSize.height" :min="1" placeholder="H" />
              <n-button size="tiny" type="primary" @click="applyAbsoluteSize">OK</n-button>
            </div>
          </div>
        </div>
      </n-popover>

      <!-- Grouping -->
      <div class="flex items-center gap-1">
        <n-button quaternary size="small" :disabled="!editor.canGroup" @click="groupSelection">Group</n-button>
        <n-button quaternary size="small" :disabled="!editor.canUngroup" @click="ungroupSelection">Ungroup</n-button>
        <n-button quaternary size="small" :disabled="!editor.canResize" @click="() => lockSelection(true)">Lock</n-button>
        <n-button quaternary size="small" :disabled="!editor.canResize" @click="() => lockSelection(false)">Unlock</n-button>
        <n-button quaternary size="small" :disabled="!editor.canResize" @click="() => moveLayer('forward')">▲</n-button>
        <n-button quaternary size="small" :disabled="!editor.canResize" @click="() => moveLayer('backward')">▼</n-button>
        <n-button quaternary size="small" :disabled="!editor.canResize" @click="duplicateSelection">Duplicate</n-button>
      </div>

      <!-- Grid & Guides -->
      <n-popover trigger="click" placement="bottom-start">
        <template #trigger>
          <n-button quaternary size="small">{{ gridLabel }}</n-button>
        </template>
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs uppercase tracking-wide text-gray-500">Сетка</span>
            <n-switch size="small" v-model:value="gridEnabled" @update:value="toggleGrid" />
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs uppercase tracking-wide text-gray-500">Привязка</span>
            <n-switch size="small" v-model:value="snapEnabled" @update:value="toggleSnap" />
          </div>
          <div class="grid grid-cols-[auto,1fr] items-center gap-2">
            <span class="text-xs uppercase tracking-wide text-gray-500">Шаг</span>
            <n-input-number size="small" v-model:value="gridSize" :min="5" :step="5" @update:value="updateGridSize" />
            <span class="text-xs uppercase tracking-wide text-gray-500">Цвет</span>
            <n-color-picker size="small" v-model:value="gridColor" @update:value="updateGridColor" />
          </div>
          <div class="flex items-center gap-2">
            <n-button size="tiny" @click="() => addGuide('horizontal')">Горизонтальная</n-button>
            <n-button size="tiny" @click="() => addGuide('vertical')">Вертикальная</n-button>
          </div>
        </div>
      </n-popover>

      <!-- Zoom -->
      <div class="flex items-center gap-1 ml-auto">
        <n-button quaternary size="small" @click="() => adjustZoom(0.1)">+</n-button>
        <n-button quaternary size="small" @click="() => adjustZoom(-0.1)">−</n-button>
        <n-button quaternary size="small" @click="fitToScreen">Fit</n-button>
        <n-button quaternary size="small" @click="() => setZoom(1)">100%</n-button>
        <span class="px-2 py-1 text-xs bg-gray-100 rounded">Zoom: {{ Math.round(editor.zoom * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, reactive, ref} from 'vue'
import {storeToRefs} from 'pinia'
import {fabric} from 'fabric'
import {useEditorStore} from '../store/editor'
import {useCanvas} from '../composables/useCanvas'
import {NPopover, NButton, NSelect, NInputNumber, NColorPicker, NSwitch, useMessage} from 'naive-ui'

const editor = useEditorStore()
const message = useMessage()
const {canvas} = useCanvas()
const {gridEnabled, snapEnabled, gridSize, gridColor} = storeToRefs(editor)

const fontOptions = [
  {label: 'Roboto', value: 'Roboto'},
  {label: 'Arial', value: 'Arial'},
  {label: 'Courier New', value: 'Courier New'},
  {label: 'Verdana', value: 'Verdana'}
]

const textState = reactive({
  fontFamily: 'Arial',
  fontSize: 16,
  bold: false,
  italic: false,
  underline: false,
  fill: '#000000',
  lineHeight: 1.2,
  align: 'left'
})

const distributionSpacing = ref<number | null>(null)
const absoluteSize = reactive<{width: number | null; height: number | null}>({width: null, height: null})

const alignLabel = computed(() => {
  const map: Record<string, string> = {
    left: 'Align Left',
    right: 'Align Right',
    'center-h': 'Align Center',
    top: 'Align Top',
    bottom: 'Align Bottom',
    'center-v': 'Align Middle'
  }
  return map[editor.lastAlign] ?? 'Align'
})

const gridLabel = computed(() => (editor.gridEnabled ? 'Grid On' : 'Grid Off'))

function getActiveObjects(): fabric.Object[] {
  const c = canvas.value
  if (!c) return []
  const active = c.getActiveObject() as any
  if (!active) return []
  if (active.type === 'activeSelection') {
    return (active._objects ?? []) as fabric.Object[]
  }
  if (active.type === 'group') {
    return (active._objects ?? []) as fabric.Object[]
  }
  return [active as fabric.Object]
}

function applyText() {
  const objects = getActiveObjects()
  if (!objects.length) return
  objects.forEach(obj => {
    const update: Record<string, any> = {
      fontFamily: textState.fontFamily,
      fontSize: textState.fontSize,
      fill: textState.fill,
      lineHeight: textState.lineHeight,
      underline: textState.underline,
      fontWeight: textState.bold ? 'bold' : 'normal',
      fontStyle: textState.italic ? 'italic' : 'normal'
    }
    if ('set' in obj) {
      if ('textAlign' in obj) update.textAlign = textState.align
      obj.set(update)
      obj.setCoords()
    }
  })
  canvas.value?.requestRenderAll()
  canvas.value?.fire('object:modified')
  message.success(`Text updated (${objects.length})`)
}

function toggleText(field: 'bold' | 'italic' | 'underline') {
  (textState as any)[field] = !(textState as any)[field]
  applyText()
}

function setTextAlign(align: string) {
  textState.align = align
  applyText()
}

function runAlign(mode: 'left' | 'right' | 'center-h' | 'top' | 'bottom' | 'center-v') {
  const c = canvas.value
  if (!c) return
  const objects = getActiveObjects()
  if (objects.length < 2) return
  const info = objects.map(obj => {
    const rect = obj.getBoundingRect(true, true)
    return {
      obj,
      rect,
      offsetX: (obj.left ?? 0) - rect.left,
      offsetY: (obj.top ?? 0) - rect.top
    }
  })
  const minLeft = Math.min(...info.map(i => i.rect.left))
  const maxRight = Math.max(...info.map(i => i.rect.left + i.rect.width))
  const minTop = Math.min(...info.map(i => i.rect.top))
  const maxBottom = Math.max(...info.map(i => i.rect.top + i.rect.height))
  const centerX = (minLeft + maxRight) / 2
  const centerY = (minTop + maxBottom) / 2

  info.forEach(entry => {
    const {obj, rect, offsetX, offsetY} = entry
    if (mode === 'left') obj.set({left: minLeft + offsetX})
    if (mode === 'right') obj.set({left: maxRight - rect.width + offsetX})
    if (mode === 'center-h') obj.set({left: centerX - rect.width / 2 + offsetX})
    if (mode === 'top') obj.set({top: minTop + offsetY})
    if (mode === 'bottom') obj.set({top: maxBottom - rect.height + offsetY})
    if (mode === 'center-v') obj.set({top: centerY - rect.height / 2 + offsetY})
    obj.setCoords()
  })

  c.requestRenderAll()
  editor.setLastAlign(mode)
  c.fire('object:modified', {target: info[0].obj})
  message.success(`Выравнивание (${objects.length})`)
}

function runDistribute(mode: 'horizontal-centers' | 'vertical-centers' | 'horizontal-spacing' | 'vertical-spacing') {
  const c = canvas.value
  if (!c) return
  const objects = getActiveObjects()
  if (objects.length < 3) return
  const isHorizontal = mode.includes('horizontal')
  const items = objects.map(obj => {
    const rect = obj.getBoundingRect(true, true)
    return {
      obj,
      rect,
      offsetX: (obj.left ?? 0) - rect.left,
      offsetY: (obj.top ?? 0) - rect.top
    }
  })
  const sorted = [...items].sort((a, b) => isHorizontal ? a.rect.left - b.rect.left : a.rect.top - b.rect.top)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  if (!first || !last) return

  if (mode.includes('centers')) {
    const firstCenter = isHorizontal
        ? first.rect.left + first.rect.width / 2
        : first.rect.top + first.rect.height / 2
    const lastCenter = isHorizontal
        ? last.rect.left + last.rect.width / 2
        : last.rect.top + last.rect.height / 2
    const step = (lastCenter - firstCenter) / (sorted.length - 1)
    sorted.forEach((entry, idx) => {
      if (isHorizontal) {
        const center = firstCenter + step * idx
        entry.obj.set({left: center - entry.rect.width / 2 + entry.offsetX})
      } else {
        const center = firstCenter + step * idx
        entry.obj.set({top: center - entry.rect.height / 2 + entry.offsetY})
      }
      entry.obj.setCoords()
    })
  } else {
    const customSpacing = distributionSpacing.value
    const totalSpan = isHorizontal
        ? (last.rect.left + last.rect.width) - first.rect.left
        : (last.rect.top + last.rect.height) - first.rect.top
    const totalSize = sorted.reduce((acc, entry) => acc + (isHorizontal ? entry.rect.width : entry.rect.height), 0)
    const autoSpacing = (totalSpan - totalSize) / (sorted.length - 1)
    const spacing = customSpacing !== null ? customSpacing : autoSpacing
    let cursor = isHorizontal ? first.rect.left + first.rect.width : first.rect.top + first.rect.height
    for (let i = 1; i < sorted.length - 1; i += 1) {
      const entry = sorted[i]
      if (isHorizontal) {
        cursor += spacing
        entry.obj.set({left: cursor - entry.rect.width + entry.offsetX})
        cursor += entry.rect.width
      } else {
        cursor += spacing
        entry.obj.set({top: cursor - entry.rect.height + entry.offsetY})
        cursor += entry.rect.height
      }
      entry.obj.setCoords()
    }
  }

  c.requestRenderAll()
  editor.setLastDistribute(mode)
  c.fire('object:modified', {target: objects[0]})
  message.success('Распределено')
}

function matchSize(mode: 'width' | 'height' | 'both') {
  const c = canvas.value
  if (!c) return
  const objects = getActiveObjects()
  if (objects.length < 2) return
  const anchor = objects[0]
  const baseRect = anchor.getBoundingRect(true, true)
  objects.forEach(obj => {
    if (obj === anchor) return
    const rect = obj.getBoundingRect(true, true)
    if ((mode === 'width' || mode === 'both') && rect.width) {
      const factor = baseRect.width / rect.width
      obj.set({scaleX: (obj.scaleX ?? 1) * factor})
    }
    if ((mode === 'height' || mode === 'both') && rect.height) {
      const factor = baseRect.height / rect.height
      obj.set({scaleY: (obj.scaleY ?? 1) * factor})
    }
    obj.setCoords()
  })
  c.requestRenderAll()
  c.fire('object:modified', {target: anchor})
  message.success('Размеры синхронизированы')
}

function applyAbsoluteSize() {
  const c = canvas.value
  if (!c) return
  const objects = getActiveObjects()
  if (!objects.length) return
  objects.forEach(obj => {
    const rect = obj.getBoundingRect(true, true)
    if (absoluteSize.width) {
      const factor = absoluteSize.width / rect.width
      obj.set({scaleX: (obj.scaleX ?? 1) * factor})
    }
    if (absoluteSize.height) {
      const factor = absoluteSize.height / rect.height
      obj.set({scaleY: (obj.scaleY ?? 1) * factor})
    }
    obj.setCoords()
  })
  c.requestRenderAll()
  c.fire('object:modified', {target: objects[0]})
  message.success('Абсолютный размер применён')
}

function groupSelection() {
  const c = canvas.value
  if (!c) return
  const active = c.getActiveObject() as any
  if (active && active.type === 'activeSelection') {
    const group = active.toGroup()
    group.set({id: crypto.randomUUID()})
    c.setActiveObject(group)
    c.requestRenderAll()
    c.fire('object:modified', {target: group})
    message.success(`Группа создана (${group.size()})`)
  }
}

function ungroupSelection() {
  const c = canvas.value
  if (!c) return
  const active = c.getActiveObject() as any
  if (active && active.type === 'group') {
    active.toActiveSelection()
    c.requestRenderAll()
    c.fire('object:modified', {target: active})
    message.success('Группа разобрана')
  }
}

function lockSelection(state: boolean) {
  const objects = getActiveObjects()
  if (!objects.length) return
  objects.forEach(obj => {
    obj.lockMovementX = state
    obj.lockMovementY = state
    obj.selectable = !state
    obj.evented = !state
  })
  canvas.value?.requestRenderAll()
  canvas.value?.fire('object:modified', {target: objects[0]})
  message.success(state ? 'Элементы заблокированы' : 'Элементы разблокированы')
}

function moveLayer(direction: 'forward' | 'backward') {
  const c = canvas.value
  if (!c) return
  const active = c.getActiveObject()
  if (!active) return
  if (direction === 'forward') {
    c.bringForward(active)
  } else {
    c.sendBackwards(active)
  }
  c.requestRenderAll()
  c.fire('object:modified', {target: active})
  message.success('Слой обновлён')
}

function duplicateSelection() {
  const c = canvas.value
  if (!c) return
  const objects = getActiveObjects()
  if (!objects.length) return
  objects.forEach(obj => {
    obj.clone((clone: fabric.Object | null) => {
      if (!clone) return
      clone.set({
        left: (clone.left ?? 0) + 20,
        top: (clone.top ?? 0) + 20
      })
      ;(clone as any).id = crypto.randomUUID()
      c.add(clone)
      c.setActiveObject(clone)
      c.requestRenderAll()
      message.success('Элемент дублирован')
    })
  })
}

function toggleGrid(val: boolean) {
  editor.setGridEnabled(val)
}

function toggleSnap(val: boolean) {
  editor.setSnapEnabled(val)
}

function updateGridSize(val: number | null) {
  if (val) editor.setGridSize(val)
}

function updateGridColor(val: string) {
  editor.setGridColor(val)
}

function addGuide(orientation: 'horizontal' | 'vertical') {
  const c = canvas.value
  if (!c) return
  const length = orientation === 'horizontal' ? c.getWidth() : c.getHeight()
  const position = orientation === 'horizontal' ? c.getHeight() / 2 : c.getWidth() / 2
  const line = new fabric.Line(
      orientation === 'horizontal'
          ? [0, position, length, position]
          : [position, 0, position, length],
      {
        stroke: '#808080',
        selectable: false,
        evented: false,
        strokeDashArray: [6, 4],
        meta: {guide: true, orientation}
      } as fabric.ILineOptions as any
  )
  c.add(line)
  c.sendToBack(line)
  c.requestRenderAll()
  message.success('Направляющая добавлена')
}

function adjustZoom(delta: number) {
  setZoom(Math.max(0.1, editor.zoom + delta))
}

function setZoom(value: number) {
  editor.setZoom(value)
}

function fitToScreen() {
  const c = canvas.value
  if (!c) return
  const wrapper = c.getElement().parentElement
  if (!wrapper) return
  const zoomX = wrapper.clientWidth / c.getWidth()
  const zoomY = wrapper.clientHeight / c.getHeight()
  setZoom(Math.min(zoomX, zoomY))
}
</script>

<style scoped>
:deep(.n-popover) {
  max-width: none;
}
</style>
