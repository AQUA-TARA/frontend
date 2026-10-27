<script setup>
import { ref, onMounted } from 'vue'
import AddNodeModal from '@/components/admin/AddNodeModal.vue'
import {
  fetchIoTNodes,
  createIoTNode,
} from '@/services/iotNodeService.js'

const nodes = ref([])
const showAddModal = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

const getNodeStatusStyle = (isActive) => {
  return isActive
    ? 'bg-[#38bdf8] text-white'
    : 'bg-[#ef4444] text-white'
}

const fetchNodes = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await fetchIoTNodes()
    nodes.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to load IoT nodes:', error)
    errorMessage.value = error.message || 'Gagal memuat data node IoT.'
  } finally {
    isLoading.value = false
  }
}


const addNode = async (node) => {
  if (!node.name || node.latitude == null || node.longitude == null) {
    alert('Data node belum lengkap.')
    throw new Error('Data node belum lengkap.')
  }

  try {
    const payload = {
      hardware_id: node.name,
      latitude: node.latitude,
      longitude: node.longitude,
      is_active: true,
      is_simulation: true,
    }

    const created = await createIoTNode(payload)

    nodes.value.unshift(created)
    showAddModal.value = false
  } catch (error) {
    console.error('Gagal menambahkan node:', error)
    alert(error.message || 'Gagal menambahkan node.')
    throw error
  }
}


onMounted(fetchNodes)
</script>

<template>
  <div
    class="p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6 text-slate-900 font-sans"
  >
    <header class="flex items-center justify-between mb-4">
      <div>
        <h1
          class="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight"
        >
          IoT Nodes
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Pantau status perangkat IoT, lokasi node, dan data kekeruhan air secara real-time.
        </p>
      </div>

      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
      >
        Tambah Node
      </button>
    </header>

    <div class="bg-white border-2 border-[#54b8ea] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="border-b border-slate-700/60 text-[11px] font-bold text-slate-900 tracking-wider"
            >
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Nama</th>
              <th class="px-6 py-4">Lokasi</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th class="px-6 py-4 text-center">Terakhir Update</th>
              <th class="px-6 py-4 text-center">Kekeruhan (NTU)</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100 text-xs text-slate-800">
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-10 text-center text-slate-500">
                Memuat data node IoT...
              </td>
            </tr>

            <tr v-else-if="errorMessage">
              <td colspan="6" class="px-6 py-10 text-center text-red-600">
                {{ errorMessage }}
                <button
                  @click="fetchNodes"
                  class="ml-2 text-indigo-600 underline"
                >
                  Coba lagi
                </button>
              </td>
            </tr>

            <tr v-else-if="nodes.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-slate-500">
                Belum ada node IoT. Klik "Tambah Node" untuk menambahkan node.
              </td>
            </tr>

            <tr
              v-for="node in nodes"
              v-else
              :key="node.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-6 py-4">
                {{ `IoT-${String(node.id).padStart(3, '0')}` }}
              </td>

              <td class="px-6 py-4">{{ node.hardware_id }}</td>

              <td class="px-6 py-4">
                {{ node.latitude }}, {{ node.longitude }}
              </td>

              <td class="px-6 py-4 text-center">
                <span
                  class="inline-block px-2 py-1 rounded-full text-[11px] font-semibold"
                  :class="getNodeStatusStyle(node.is_active)"
                >
                  {{ node.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>

              <!-- Kolom Terakhir Update -->
              <td class="px-6 py-4 text-center">
                {{
                  node.measured_at
                    ? new Date(node.measured_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'
                }}
              </td>

              <!-- Kolom Kekeruhan -->
              <td class="px-6 py-4 text-center">
                {{
                  node.turbidity != null
                    ? Number(node.turbidity).toLocaleString('id-ID', {
                        maximumFractionDigits: 2,
                      })
                    : '-'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AddNodeModal
      v-if="showAddModal"
      @close="showAddModal = false"
      :on-submit="addNode"
    />
  </div>
</template>

<style scoped>
/* Minimal styling consistent with other admin pages */
</style>