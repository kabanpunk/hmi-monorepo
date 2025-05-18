<template>
  <div ref="wrap" class="flex-1 h-full min-w-0 relative overflow-hidden">
    <canvas ref="cnv" class="block w-full h-full"/>
  </div>
</template>

<script setup lang="ts">
import {shallowRef, onMounted, watch} from 'vue'
import {fabric} from 'fabric'
import {setCanvas} from '@/composables/useCanvas'
import {useHmiRuntime, type HmiFile} from '@/runtime/useHmiRuntime'

const props = defineProps<{ hmi: HmiFile | null }>()

const wrap = shallowRef<HTMLElement>()
const cnv = shallowRef<HTMLCanvasElement>()

const runtime = shallowRef<ReturnType<typeof useHmiRuntime>>()

onMounted(() => {
  const canvas = new fabric.Canvas(cnv.value!, {selection: false})

  setCanvas(canvas)

  const ro = new ResizeObserver(([entry]) => {
    canvas.setDimensions({
      width: entry.contentRect.width,
      height: entry.contentRect.height
    })
  })
  wrap.value && ro.observe(wrap.value)

  runtime.value = useHmiRuntime(canvas)

  if (props.hmi) runtime.value.loadHmi(props.hmi)
})

watch(
    () => props.hmi,
    (file) => {
      if (file && runtime.value) {
        runtime.value.loadHmi(file)
      }
    }
)
</script>
