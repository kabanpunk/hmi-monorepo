<template>
  <div class="flex h-screen overflow-hidden">
    <LeftSidebar class="flex-shrink-0" />
    <div class="flex-1 flex flex-col min-w-0">
      <EditorToolbar v-if="!editor.isRuntime" class="flex-shrink-0" />
      <CanvasComponent class="flex-1" @update:selectedObject="selected = $event" />
    </div>
    <RightSidebar :selected="selected" class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LeftSidebar   from './components/LeftSidebar.vue'
import CanvasComponent from './components/CanvasComponent.vue'
import RightSidebar  from './components/RightSidebar.vue'
import { fabric } from 'fabric'
import EditorToolbar from './components/EditorToolbar.vue'
import {useEditorStore} from './store/editor'

const selected = ref<fabric.Object | null>(null)
const editor = useEditorStore()

</script>
