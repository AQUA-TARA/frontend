
<script setup>
import { ref } from 'vue'

const props = defineProps({
  onSubmit: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['close'])

const nodeName = ref('')
const isGpsSynced = ref(false)
const isSubmitting = ref(false)

// Koordinat referensi lokasi
const GPS_LOCATION = {
  latitude: 3.3000,
  longitude: 117.6333,
}

const syncGps = () => {
  if (isSubmitting.value) return
  isGpsSynced.value = true
}

const close = () => {
  if (isSubmitting.value) return
  emit('close')
}

const submit = async () => {
  if (isSubmitting.value) return

  const name = nodeName.value.trim()

  if (!name) {
    alert('Harap isi nama node.')
    return
  }

  if (!isGpsSynced.value) {
    alert('Silakan lakukan sinkronisasi GPS terlebih dahulu.')
    return
  }

  isSubmitting.value = true

  try {
    await props.onSubmit({
      name,
      latitude: GPS_LOCATION.latitude,
      longitude: GPS_LOCATION.longitude,
    })
  } catch (error) {
    // Pesan error ditangani oleh komponen parent.
    console.error('Gagal menyimpan node:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
    @click.self="close"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border-2 border-[#54b8ea] text-slate-900 font-sans"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-200 flex items-center justify-between"
      >
        <h2 class="text-base font-extrabold text-slate-950">
          Tambah Node IoT
        </h2>

        <button
          type="button"
          @click="close"
          :disabled="isSubmitting"
          aria-label="Tutup"
          class="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="submit"
        class="p-6 flex-1 overflow-y-auto"
      >
        <div class="grid gap-5">
          <!-- Nama Node -->
          <div>
            <label
              for="nodeName"
              class="block text-sm font-medium text-slate-700 mb-1"
            >
              Nama Node
            </label>

            <input
              id="nodeName"
              v-model="nodeName"
              type="text"
              required
              maxlength="100"
              :disabled="isSubmitting"
              placeholder="Contoh: Node PDAM 01"
              class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
            />
          </div>

          <!-- Lokasi Perangkat -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Lokasi Perangkat
            </label>

            <button
              type="button"
              @click="syncGps"
              :disabled="isSubmitting"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :class="isGpsSynced
                ? 'bg-sky-50 border-sky-400 text-sky-700'
                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 2v2m0 16v2M4 12H2m20 0h-2M19.07 4.93l-1.42 1.42M6.35 17.65l-1.42 1.42m14.14 0l-1.42-1.42M6.35 6.35L4.93 4.93M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                />
              </svg>

              {{
                isGpsSynced
                  ? 'GPS Tersinkronisasi'
                  : 'Sinkronisasi GPS'
              }}
            </button>

            <p
              v-if="isGpsSynced"
              class="mt-2 text-sm text-emerald-700 flex items-center gap-2"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Lokasi berhasil disiapkan.
            </p>

            <p v-else class="mt-2 text-xs text-slate-500">
              Sinkronkan lokasi sebelum menyimpan node.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="close"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 min-w-[145px] flex items-center justify-center gap-2 bg-indigo-600 text-white rounded transition-all duration-200 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isSubmitting"
              class="w-4 h-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>

            <span>
              {{ isSubmitting ? 'Menyimpan...' : 'Tambah Node' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
