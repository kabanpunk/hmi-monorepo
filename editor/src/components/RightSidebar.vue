<template>
  <div v-bind="$attrs" class="w-64 bg-gray-50 border-l p-4 overflow-y-auto text-sm">
    <template v-if="sel">
      <h2 class="font-semibold text-lg mb-3 capitalize">{{ sel.elementType }}</h2>

      <!-- ─────────── layer / z‑index controls ─────────── -->
      <details open class="mb-4">
        <summary class="cursor-pointer font-medium mb-1">Слой</summary>
        <div class="flex items-center gap-2 mb-2">
          <!-- up / forward -->
          <n-button
              size="tiny"
              secondary
              @click="moveForward"
              :disabled="layerIndex >= maxLayer"
          >
            <template #icon>
              <n-icon>
                <ArrowUp/>
              </n-icon>
            </template>
          </n-button>
          <!-- down / backward -->
          <n-button
              size="tiny"
              secondary
              @click="moveBackward"
              :disabled="layerIndex <= 0"
          >
            <template #icon>
              <n-icon>
                <ArrowDown/>
              </n-icon>
            </template>
          </n-button>
          <!-- direct numeric input -->
          <n-input-number
              v-model:value="layerIndex"
              :min="0"
              :max="maxLayer"
              size="small"
              class="flex-1"
              @update:value="setLayer"
          />
        </div>
      </details>

      <!-- ─────────── element custom props ─────────── -->
      <details open class="mb-4">
        <summary class="cursor-pointer font-medium mb-1">Свойства</summary>
        <div v-for="(val,key) in propsProxy" :key="key" class="mb-2">
          <label class="block mb-1">{{ key }}</label>
          <n-input v-model:value="propsProxy[key]" size="small"/>
          <n-color-picker
              v-if="looksLikeColor(val,key)"
              v-model:value="propsProxy[key]"
              :show-alpha="true"
              size="small"
              @update:value="applyProps"/>
          <n-input
              v-else
              v-model:value="propsProxy[key]"
              size="small"/>
        </div>
        <n-button size="tiny" type="primary" @click="applyProps">Применить</n-button>
      </details>

      <!-- ─────────── bindings (I/O) ─────────── -->
      <n-tabs type="card" size="small" animated>
        <n-tab-pane name="inputs" tab="Входы (read)">
          <div v-if="inputs.length">
            <div v-for="pin in inputs" :key="pin" class="mb-2">
              <label class="block mb-1">{{ pin }}</label>
              <n-select
                  :options="backendOutputsOptions"
                  v-model:value="bindings.inputs[pin]"
                  placeholder="— не привязано —"
                  filterable
                  clearable
                  size="small"
              />
            </div>
          </div>
          <p v-else class="text-gray-400">Нет входных пинов</p>
        </n-tab-pane>

        <n-tab-pane name="outputs" tab="Выходы (write)">
          <div v-if="outputs.length">
            <div v-for="pin in outputs" :key="pin" class="mb-2">
              <label class="block mb-1">{{ pin }}</label>
              <n-select
                  :options="backendInputsOptions"
                  v-model:value="bindings.outputs[pin]"
                  placeholder="— не привязано —"
                  filterable
                  clearable
                  size="small"
              />
            </div>
          </div>
          <p v-else class="text-gray-400">Нет выходных пинов</p>
        </n-tab-pane>
      </n-tabs>
    </template>

    <p v-else class="text-gray-400">Выделите объект для редактирования</p>
  </div>
</template>

<script setup lang="ts">
import {computed, reactive, ref, watch} from 'vue'
import {
  NInput,
  NButton,
  NTabs,
  NTabPane,
  NSelect,
  NIcon,
  NInputNumber,
  NColorPicker,
} from 'naive-ui'
import {ArrowUp, ArrowDown} from '@vicons/ionicons5'
import type {fabric} from 'fabric'
import {useSessionStore} from '../store/session'

function looksLikeColor(val: any, key = ''): boolean {
  return typeof val === 'string' &&
      (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ||
          /^rgba?/.test(val) ||
          key.toLowerCase().includes('color') ||
          key.toLowerCase() === 'stroke')
}

/* ─────────── selection & layer index ─────────── */
const props = defineProps<{ selected: fabric.Object | null }>()
const sel = computed(() => props.selected)

const layerIndex = ref(0)
const maxLayer = ref(0)

watch(
    sel,
    s => {
      if (s?.canvas) {
        const objs = s.canvas.getObjects()
        layerIndex.value = objs.indexOf(s)
        maxLayer.value = objs.length - 1
      } else {
        layerIndex.value = 0
        maxLayer.value = 0
      }
    },
    {immediate: true}
)


function setLayer(idx: number | null) {
  if (idx === null || !sel.value) return
  const canvas = sel.value.canvas
  if (!canvas) return

  const newIdx = Math.max(0, Math.min(idx, canvas.getObjects().length - 1))
  sel.value.moveTo(newIdx)
  canvas.requestRenderAll()
  layerIndex.value = newIdx
}

function moveForward() {
  setLayer(layerIndex.value + 1)
}

function moveBackward() {
  setLayer(layerIndex.value - 1)
}

/* ─────────── element custom props (existing) ─────────── */
const propsProxy = reactive<Record<string, any>>({})
watch(
    sel,
    s => {
      // reset & clone to keep reactivity simple
      Object.keys(propsProxy).forEach(k => delete propsProxy[k])
      if (s?.customProps) Object.assign(propsProxy, JSON.parse(JSON.stringify(s.customProps)))
    },
    {immediate: true}
)

function applyProps() {
  if (!sel.value) return
  sel.value.customProps = {...propsProxy}
  (sel.value as any).updateFromProps?.()
  sel.value.canvas?.requestRenderAll()
}

/* ─────────── bindings (existing) ─────────── */
const ss = useSessionStore()
const makeOpts = (obj: Record<string, any>) => Object.keys(obj).map(k => ({label: k, value: k}))
const backendInputsOptions = computed(() => makeOpts(ss.backendInputs))
const backendOutputsOptions = computed(() => makeOpts(ss.backendOutputs))

const inputs = computed<string[]>(() => sel.value?.meta?.inputs ?? [])
const outputs = computed<string[]>(() => sel.value?.meta?.outputs ?? [])

const bindings = reactive<{ inputs: Record<string, string>; outputs: Record<string, string> }>(
    {inputs: {}, outputs: {}}
)

watch(sel, s => {
  bindings.inputs = s?.bindings?.inputs ?? {} //
  bindings.outputs = s?.bindings?.outputs ?? {}
}, {immediate: true})

watch(bindings, () => {
  if (!sel.value) return
  sel.value.bindings = JSON.parse(JSON.stringify(bindings))
}, {deep: true})


watch(propsProxy, () => {
  if (sel.value && typeof (sel.value as any).updateFromProps === 'function') {
    sel.value.customProps = {...propsProxy}
    ;(sel.value as any).updateFromProps()
  }
}, {deep: true})
</script>

<style scoped>
details > summary {
  list-style: none;
}

details > summary::-webkit-details-marker {
  display: none;
}
</style>
