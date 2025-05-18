<template>
  <div class="h-full flex flex-row">
    <!-- Левая часть — привычный TopBar + Canvas -->
    <div class="flex-1 flex flex-col h-full min-w-0">
      <TopBar @load-hmi="handleFile"/>
      <ViewerCanvas :hmi="hmiFile" class="flex-1 min-h-0"/>
    </div>

    <!-- Правая часть — новый браузер состояний -->
    <div class="flex-shrink-0 w-[500px] border-l h-full overflow-auto z-10">
      <SnapshotPanel />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TopBar        from '@/components/TopBar.vue'
import ViewerCanvas  from '@/components/ViewerCanvas.vue'
import SnapshotPanel from '@/components/SnapshotPanel.vue'
import { useSessionStore } from '@/store/session'
import type { HmiFile } from '@/runtime/useHmiRuntime'

const hmiFile = ref<HmiFile | null>(null)

function handleFile(file: File) {
  console.debug('[App] picked file →', file.name, file)
  file.text().then(t => {
    let json: HmiFile
    try {
      json = JSON.parse(t) as HmiFile
    } catch (e) {
      console.error('[App] invalid JSON in file:', e)
      return
    }
    console.debug('[App] parsed HMI:', json)
    hmiFile.value = json
  })
}
onMounted(() => {
  const id = new URLSearchParams(location.search).get('session') ?? ''
  if (id) useSessionStore().setSession(id)
})
</script>
