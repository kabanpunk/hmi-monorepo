<template>
  <div v-bind="$attrs">
    <!----- переключатель режима ------------------>
    <n-radio-group
        v-model:value="mode"
        class="mb-4"
        size="small"
    >
      <n-radio-button value="runtime">Интерактив</n-radio-button>
      <n-radio-button value="design">Редактирование</n-radio-button>
    </n-radio-group>
    <div class="w-64 bg-gray-100 p-4 overflow-y-auto space-y-2 border-r">
      <h2 class="font-semibold text-lg mb-2">Элементы</h2>
      <button
          v-for="s in palette"
          :key="s.key"
          draggable="true"
          @dragstart="e => e.dataTransfer?.setData('shape', s.key)"
          class="block w-full px-3 py-1.5 bg-white rounded shadow text-left hover:bg-gray-50 active:scale-95 transition"
      >
        {{ s.label }}
      </button>
    </div>

    <hr class="my-3"/>

    <n-button block secondary size="small" class="mb-2" @click="doSave">
      Сохранить (JSON)
    </n-button>
    <n-button block tertiary size="small" @click="fileInp.click()">
      Загрузить...
    </n-button>
    <input
        type="file"
        accept=".json"
        ref="fileInp"
        class="hidden"
        @change="onFile"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {NButton} from 'naive-ui'
import {useCanvas} from '../composables/useCanvas'
import {ElementRegistry} from '../elements'
import {useEditorStore} from '../store/editor'

const editor = useEditorStore()
const mode = computed({
  get: () => editor.mode,
  set: v => editor.setMode(v)
})

const {canvas} = useCanvas()

const palette = Object.entries(ElementRegistry).map(([key, ctor]) => ({
  key,
  label: (ctor as any).elementType || key
}))

const fileInp = ref<HTMLInputElement>()

function doSave() {
  if (!canvas.value) return
  const hmi = {
    meta: {version: '1.0', created: new Date().toISOString()},
    canvas: canvas.value.toJSON(['id', 'customProps', 'elementType', 'bindings', 'meta']),
    bindings: canvas.value.getObjects().map(o => ({
      elementId: o.id,
      inputBindings: o.bindings?.inputs ?? {},
      outputBindings: o.bindings?.outputs ?? {},
    }))
  }
  const blob = new Blob([JSON.stringify(hmi, null, 2)], {type: 'application/json'})
  const a = document.createElement('a')
  a.download = 'screen.hmi.json'
  a.href = URL.createObjectURL(blob)
  a.click()
}

function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f || !canvas.value) return
  f.text().then(text => {
    const json = JSON.parse(text)
    canvas.value.clear()
    fabric.util.enlivenObjects(json.canvas.objects, objs => {
      objs.forEach(o => canvas.value!.add(o))
      canvas.value!.renderAll()
    })
  })
}
</script>
