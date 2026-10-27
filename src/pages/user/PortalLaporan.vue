<!--
  PortalLaporan.vue — USER UI
  Faithfully reproduces Home Page.png and Home Page(Diisi).png
-->
<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { devReportState } from './devReportState'
import { submitReport } from '@/api/client.js'

const router = useRouter()

// Location state
const isLocating = ref(false)
const locationError = ref('')
const displayAddress = ref(devReportState.address || '')
const addressLoading = ref(false)
const addressError = ref('')

// Check if location is available
const hasLocation = computed(() => {
  return devReportState.latitude !== null && devReportState.longitude !== null
})

// Check if photo is available
const hasPhoto = computed(() => {
  return !!devReportState.photoDataUrl
})

// Acquire browser geolocation
const acquireLocation = () => {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation tidak tersedia pada perangkat Anda.'
    return
  }

  isLocating.value = true
  locationError.value = ''
  addressLoading.value = true
  addressError.value = ''

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      devReportState.latitude = position.coords.latitude
      devReportState.longitude = position.coords.longitude
      // Reverse geocode via Nominatim
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        const address = data.display_name || `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        displayAddress.value = address
        devReportState.address = address
      } catch (e) {
        addressError.value = 'Tidak dapat menemukan nama jalan.'
        displayAddress.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        devReportState.address = ''
      } finally {
        addressLoading.value = false
        isLocating.value = false
      }
    },
    (error) => {
      addressLoading.value = false
      isLocating.value = false
      locationError.value = error.message || 'Tidak dapat memperoleh lokasi GPS.'
    },
    { enableHighAccuracy: true, timeout: 5000 }
  )
}

// Default Tarakan coordinates per UI & system specification
const DEFAULT_TARAKAN_LAT = 3.3274
const DEFAULT_TARAKAN_LNG = 117.5878
const DEFAULT_TARAKAN_ADDRESS = 'Kota Tarakan, Kalimantan Utara'

// Initialize default coordinates & address if not yet set
if (devReportState.latitude === null || devReportState.longitude === null) {
  devReportState.latitude = DEFAULT_TARAKAN_LAT
  devReportState.longitude = DEFAULT_TARAKAN_LNG
}
if (!displayAddress.value) {
  displayAddress.value = devReportState.address || DEFAULT_TARAKAN_ADDRESS
  devReportState.address = displayAddress.value
}

// Navigation to camera capture
const openCamera = () => {
  router.push('/camera')
}

// File input reference & trigger
const fileInputRef = ref(null)
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// File input fallback / simulator for drag and drop
const selectedFile = ref(null)

const handleFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = (event) => {
      devReportState.photoDataUrl = event.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Retake photo or clear
const clearPhoto = () => {
  devReportState.photoDataUrl = null
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const isSubmitting = ref(false)
const submitError = ref('')

// Helper to convert dataURL to Blob
const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const handleSubmit = async () => {
  isSubmitting.value = true
  submitError.value = ''
  try {
    const reportType = (devReportState.report_type || '').trim()
    if (!reportType) {
      throw new Error('Kategori laporan wajib dipilih.')
    }

    const description = (devReportState.description || '').trim()
    if (!description) {
      throw new Error('Deskripsi keluhan wajib diisi.')
    }

    const hasPhotoData = !!selectedFile.value || !!devReportState.photoDataUrl
    if (!hasPhotoData) {
      throw new Error('Foto bukti kualitas air wajib diunggah atau dipotret terlebih dahulu.')
    }

    const lat = devReportState.latitude ?? DEFAULT_TARAKAN_LAT
    const lng = devReportState.longitude ?? DEFAULT_TARAKAN_LNG

    const formData = new FormData()
    formData.append('report_type', reportType)
    formData.append('description', description)
    formData.append('latitude', lat)
    formData.append('longitude', lng)

    if (selectedFile.value) {
      formData.append('photo', selectedFile.value)
    } else if (devReportState.photoDataUrl) {
      const blob = dataURLtoBlob(devReportState.photoDataUrl)
      formData.append('photo', blob, 'capture.jpg')
    }

    // Call client submit (throws on non-ok HTTP or success == false)
    const res = await submitReport(formData)

    const ticketCode = res?.data?.ticket_code
    if (!ticketCode) {
      throw new Error('Gagal mendapatkan nomor tiket dari server.')
    }

    devReportState.ticketId = ticketCode
    devReportState.status = res.data.status || 'SUBMITTED'

    // Sukses terkonfirmasi dari backend
    router.push('/success')
  } catch (err) {
    submitError.value = err.message || 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="px-5 py-3 space-y-4 text-slate-900 font-sans">

    <!-- Title & Description -->
    <div class="text-center pt-2 px-1">
      <h1 class="text-base font-extrabold text-slate-950">Portal Laporan Publik</h1>
      <p class="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
        Laporkan masalah aliran atau kualitas air keruh di wilayah Anda. Laporan Anda terhubung dengan Sistem Command Center PDAM Kota Tarakan untuk penanganan prioritas.
      </p>
    </div>

    <!-- Main Form matching Home Page.png -->
    <form @submit.prevent="handleSubmit" class="space-y-4">

      <!-- Field: Kategori Laporan -->
      <div>
        <label for="reportTypeSelect" class="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>Kategori Laporan</span>
        </label>

        <select
          id="reportTypeSelect"
          v-model="devReportState.report_type"
          class="w-full text-xs text-slate-900 p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white shadow-sm cursor-pointer"
        >
          <option value="" disabled>-- Pilih Kategori Laporan --</option>
          <option value="kebocoran">Kebocoran</option>
          <option value="air_keruh">Air Keruh</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <!-- Field 1: Deskripsi Keluhan -->
      <div>
        <label class="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Deskripsi Keluhan</span>
        </label>

        <textarea
          v-model="devReportState.description"
          rows="3"
          placeholder="Contoh : Air keruh berwarna coklat pekat dan berbau kaporit menyengat sejak jam 6 pagi hari ini..."
          class="w-full text-xs text-slate-900 placeholder:text-slate-400 p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white shadow-sm resize-none"
        ></textarea>
      </div>

      <!-- Field 2: Lokasi Kejadian -->
      <div>
        <label class="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Lokasi Kejadian</span>
        </label>

        <input
          type="text"
          v-model="displayAddress"
          :disabled="true"
          class="w-full text-xs font-medium text-slate-900 p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700 bg-white shadow-sm mb-2.5"
        />
        <div v-if="addressLoading" class="text-xs text-slate-600 mb-1">Mencari nama jalan...</div>
        <div v-if="addressError" class="text-xs text-red-600 mb-1">{{ addressError }}</div>

        <!-- Sinkron GPS Button -->
        <button
          type="button"
          @click="acquireLocation"
          :disabled="isLocating"
          class="w-full py-2.5 px-4 rounded-xl bg-[#007cb8] hover:bg-[#00669e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{{ isLocating ? 'Menyinkronkan GPS...' : 'Sinkron GPS' }}</span>
        </button>
      </div>

      <!-- Field 3: Bukti Kualitas Air -->
      <div>
        <label class="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Bukti Kualitas Air</span>
        </label>

        <!-- Condition A: Photo Captured/Uploaded -> Matches Home Page(Diisi).png -->
        <div v-if="devReportState.photoDataUrl" class="relative rounded-xl overflow-hidden border border-slate-700 shadow-sm">
          <img :src="devReportState.photoDataUrl" alt="Bukti air keruh" class="w-full h-36 object-cover" />
          <button
            type="button"
            @click="clearPhoto"
            class="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          <span v-if="locationError" class="text-xs text-red-600">{{ locationError }}</span>
          </button>
        </div>

        <!-- Condition B: Empty Upload Box with dashed border -> Matches Home Page.png -->
        <div
          v-else
          class="relative border-2 border-dashed border-slate-500 rounded-xl p-5 text-center bg-white/50 hover:bg-white transition-colors"
        >
          <div @click="triggerFileInput" class="cursor-pointer">
            <p class="text-xs font-bold text-slate-800">
              <span class="text-[#007cb8] underline">Unggah gambar</span> atau seret gambar kesini
            </p>
            <p class="text-[10px] text-slate-500 mt-1">
              PNG, JPG, WebP hingga 5MB
            </p>
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-center gap-2">
            <button
              type="button"
              @click="openCamera"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-400 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
            >
              <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" stroke-width="2" />
              </svg>
              <span>Ambil dari Kamera</span>
            </button>
          </div>

          <input
            type="file"
            ref="fileInputRef"
            accept="image/*"
            @change="handleFileUpload"
            class="hidden"
            id="fileInput"
          />
        </div>
      </div>

      <!-- Error Alert Message -->
      <div v-if="submitError" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs flex items-start gap-2 shadow-sm">
        <svg class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="9" stroke-width="2" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
        </svg>
        <span class="leading-relaxed">{{ submitError }}</span>
      </div>

      <!-- Submit Button -->
      <div class="pt-2">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-2.5 px-4 rounded-xl bg-[#00669e] hover:bg-[#005582] text-white text-xs font-bold shadow-md transition-colors cursor-pointer text-center"
        >
          {{ isSubmitting ? 'Mengirim...' : 'Kirim Laporan' }}
        </button>
      </div>

    </form>

  </div>
</template>
