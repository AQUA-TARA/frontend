<!--
  CameraView.vue — USER UI (Batch 1)
  Direct Browser Camera Capture View (Mobile-first, fullscreen).
  Fidelity reference: UI_SPECIFICATION.md Section A.2, DEC-014.
  Supported States:
    1. Initial
    2. Camera Permission Request / Pending
    3. Camera Permission Denied / Error
    4. Camera Active (live viewfinder)
    5. Photo Captured (preview)
    6. Retake
-->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { devReportState } from './devReportState'

const router = useRouter()

// Camera DOM element & stream reference
const videoRef = ref(null)
const canvasRef = ref(null)
let mediaStream = null

// UI States
const isPending = ref(true)
const isPermissionDenied = ref(false)
const errorMessage = ref('')
const isCaptured = ref(false)
const previewImage = ref(null)

// Initialize and start direct browser camera
const startCamera = async () => {
  isPending.value = true
  isPermissionDenied.value = false
  errorMessage.value = ''
  isCaptured.value = false

  // Check MediaDevices API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    isPending.value = false
    errorMessage.value = 'Peramban (browser) tidak mendukung akses kamera langsung.'
    return
  }

  try {
    // Request environment/rear camera if available, fallback to default video
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
    }
    isPending.value = false
  } catch (err) {
    isPending.value = false
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      isPermissionDenied.value = true
      errorMessage.value = 'Izin akses kamera ditolak oleh pengguna/browser. Mohon izinkan kamera untuk memotret bukti.'
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage.value = 'Perangkat kamera tidak ditemukan pada sistem ini.'
    } else {
      errorMessage.value = 'Gagal mengakses kamera: ' + (err.message || err.name)
    }
  }
}

// Stop camera stream tracks
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

// Capture current video frame to canvas & dataURL
const captureFrame = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value

  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  previewImage.value = dataUrl
  isCaptured.value = true

  // Pause video stream preview
  video.pause()
}

// Retake action: discard current frame, resume camera
const retake = () => {
  previewImage.value = null
  isCaptured.value = false
  if (videoRef.value) {
    videoRef.value.play()
  }
}

// Confirm photo and return to portal
const usePhoto = () => {
  if (previewImage.value) {
    devReportState.photoDataUrl = previewImage.value
    stopCamera()
    router.push('/')
  }
}

// Cancel and return to portal
const cancel = () => {
  stopCamera()
  router.push('/')
}

onMounted(() => {
  startCamera()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <div class="fixed inset-0 bg-black flex flex-col z-50 select-none">
    <!-- Top Bar: Back/Cancel and header info -->
    <div class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent text-white">
      <button
        type="button"
        @click="cancel"
        class="flex items-center space-x-1 text-xs text-white/90 hover:text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-xs cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Batal</span>
      </button>

      <span class="text-xs font-semibold tracking-wider uppercase text-white/80">
        {{ isCaptured ? 'Pratinjau Foto' : 'Kamera Bukti Air' }}
      </span>

      <!-- Placeholder flash / spacer icon for layout balance -->
      <div class="w-8 flex justify-end">
        <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    </div>

    <!-- Main Viewfinder / Canvas Area -->
    <div class="flex-grow relative flex items-center justify-center overflow-hidden bg-black">
      <!-- Live Video element -->
      <video
        ref="videoRef"
        playsinline
        muted
        autoplay
        class="w-full h-full object-cover"
        :class="{ hidden: isCaptured || isPermissionDenied || !!errorMessage }"
      ></video>

      <!-- Captured Image Preview -->
      <img
        v-if="isCaptured && previewImage"
        :src="previewImage"
        alt="Hasil Tangkapan Kamera"
        class="w-full h-full object-cover"
      />

      <!-- Hidden canvas for capturing frame -->
      <canvas ref="canvasRef" class="hidden"></canvas>

      <!-- Viewfinder Overlay (Focus Bounding Box) while active -->
      <div
        v-if="!isPending && !isPermissionDenied && !errorMessage && !isCaptured"
        class="absolute inset-0 pointer-events-none flex items-center justify-center p-8"
      >
        <div class="w-64 h-64 border-2 border-white/40 rounded-2xl relative">
          <div class="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-sky-400 rounded-tl"></div>
          <div class="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-sky-400 rounded-tr"></div>
          <div class="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-sky-400 rounded-bl"></div>
          <div class="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-sky-400 rounded-br"></div>
          <span class="absolute -bottom-7 left-0 right-0 text-center text-[10px] text-white/70">
            Arahkan kamera ke sampel air keruh
          </span>
        </div>
      </div>

      <!-- State: Pending / Loading -->
      <div v-if="isPending" class="text-center p-6 text-white z-10">
        <svg class="w-8 h-8 animate-spin mx-auto mb-3 text-sky-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs">Meminta izin & mengaktifkan kamera...</p>
      </div>

      <!-- State: Permission Denied or Device Error -->
      <div v-if="!isPending && (isPermissionDenied || errorMessage)" class="text-center p-6 text-white max-w-xs z-10">
        <div class="w-12 h-12 rounded-full bg-red-900/60 text-red-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-xs font-semibold text-red-300 mb-2">Akses Kamera Terkendala</p>
        <p class="text-[11px] text-gray-300 leading-relaxed mb-4">
          {{ errorMessage }}
        </p>
        <div class="space-y-2">
          <button
            type="button"
            @click="startCamera"
            class="w-full py-2 px-4 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium cursor-pointer"
          >
            Coba Lagi
          </button>
          <button
            type="button"
            @click="cancel"
            class="w-full py-2 px-4 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
          >
            Kembali ke Portal
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom Controls -->
    <div class="p-6 pb-8 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex items-center justify-around">
      <!-- Active Camera Controls -->
      <template v-if="!isPending && !isPermissionDenied && !errorMessage && !isCaptured">
        <!-- Spacer left -->
        <div class="w-12"></div>

        <!-- Shutter Button (Rounded 50%) -->
        <button
          type="button"
          @click="captureFrame"
          aria-label="Ambil Foto"
          class="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-transform cursor-pointer"
        >
          <div class="w-14 h-14 rounded-full bg-white shadow-md"></div>
        </button>

        <!-- Spacer right -->
        <div class="w-12"></div>
      </template>

      <!-- Captured Preview Controls: Retake & Confirm -->
      <template v-else-if="isCaptured">
        <button
          type="button"
          @click="retake"
          class="py-2.5 px-6 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
        >
          Ulangi
        </button>

        <button
          type="button"
          @click="usePhoto"
          class="py-2.5 px-6 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-md cursor-pointer"
        >
          Gunakan Foto
        </button>
      </template>
    </div>
  </div>
</template>
