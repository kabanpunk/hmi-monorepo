<template>
  <div class="flex h-screen overflow-hidden">
    <LeftSidebar  class="flex-shrink-0" />
    <CanvasComponent @update:selectedObject="selected = $event" />
    <RightSidebar :selected="selected" class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LeftSidebar   from './components/LeftSidebar.vue'
import CanvasComponent from './components/CanvasComponent.vue'
import RightSidebar  from './components/RightSidebar.vue'
import { fabric } from 'fabric'

const selected = ref<fabric.Object | null>(null)

</script>
