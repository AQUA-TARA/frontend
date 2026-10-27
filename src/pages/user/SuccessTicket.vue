<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { devReportState } from './devReportState'

const router = useRouter()

// UI state simulation toggle: 'SUDAH_LOGIN' | 'BELUM_LOGIN'
const userAuthStatus = ref('SUDAH_LOGIN')

// High Risk warning overlay active flag (matches Report Submitted (overlay).png)
const showWarningOverlay = ref(true)

const isCopied = ref(false)

const copyTicketId = async () => {
  if (!devReportState.ticketId) {
    // No ticket ID to copy
    return
  }
  try {
    await navigator.clipboard.writeText(devReportState.ticketId)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch {
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}

const submitAnother = () => {
  devReportState.reset()
  router.push('/')
}

const goToTracking = () => {
  router.push('/tracking')
}

const closeOverlay = () => {
  showWarningOverlay.value = false
}
</script>

<template>
  <div class="relative min-h-[calc(100vh-64px)] bg-gradient-to-b from-white via-[#f0f9ff]/40 to-[#fed7aa]/30 px-5 py-6 font-sans flex flex-col items-center">
    <!-- State toggle pill for dev testing -->
    <div class="w-full flex items-center justify-between text-[10px] text-gray-500 mb-4">
      <div class="flex items-center space-x-2">
        <span>Tipe:</span>
        <button
          @click="userAuthStatus = 'SUDAH_LOGIN'"
          :class="userAuthStatus === 'SUDAH_LOGIN' ? 'font-bold text-[#00669e]' : 'text-gray-400'"
        >
          Sudah Login
        </button>
        <span>•</span>
        <button
          @click="userAuthStatus = 'BELUM_LOGIN'"
          :class="userAuthStatus === 'BELUM_LOGIN' ? 'font-bold text-[#00669e]' : 'text-gray-400'"
        >
          Belum Login
        </button>
      </div>
      <button
        @click="showWarningOverlay = !showWarningOverlay"
        class="text-xs px-2 py-0.5 rounded border border-[#ea580c] text-[#ea580c] bg-white font-medium"
      >
        {{ showWarningOverlay ? 'Sembunyikan Overlay' : 'Tampilkan Overlay' }}
      </button>
    </div>

    <!-- Main Card Shell (Rounded cyan card) -->
    <div class="w-full rounded-[28px] border border-[#bae6fd] bg-[#f0f9ff]/80 backdrop-blur-md p-6 shadow-sm flex flex-col items-center text-center">
      <!-- Success Icon with dual circles -->
      <div class="w-16 h-16 rounded-full bg-[#bae6fd] flex items-center justify-center mb-4 text-[#00669e]">
        <div class="w-12 h-12 rounded-full border-2 border-[#00669e] flex items-center justify-center">
          <svg class="w-6 h-6 text-[#00669e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <h1 class="text-xl font-bold text-gray-900 tracking-tight">Laporan Diterima</h1>
      <p class="text-xs text-gray-500 mt-1 max-w-[280px]">
        Terima kasih, laporan anda telah diterima oleh sistem kami.
      </p>

      <!-- Inner Ticket Box -->
      <div class="w-full mt-5 rounded-[22px] border border-gray-100 bg-white/90 p-5 shadow-xs text-center">
        <p class="text-[11px] text-gray-500">Ticket ID</p>
        <div class="flex items-center justify-center space-x-2 mt-1">
          <span class="text-lg font-bold font-mono text-gray-900 tracking-wide">{{ devReportState.ticketId ? devReportState.ticketId : 'Ticket ID belum tersedia' }}</span>
          <button
            type="button"
            @click="copyTicketId"
            :disabled="!devReportState.ticketId"
            class="text-gray-400 hover:text-gray-700 active:scale-95 transition disabled:opacity-50"
            title="Salin Ticket ID"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <p v-if="isCopied" class="text-[9px] text-[#00669e] mt-0.5">Tersalin ke clipboard</p>

        <div class="my-3 border-t border-gray-200"></div>

        <!-- Risk Score Pill -->
        <p class="text-[11px] text-gray-500 mb-1.5">Risk Score</p>
        <div class="inline-flex flex-col items-center justify-center rounded-[20px] bg-[#eab308] px-6 py-1.5 shadow-sm">
          <span class="text-[9px] font-semibold text-gray-800 leading-none">High Risk</span>
          <span class="text-base font-bold text-gray-900 leading-tight">92/100</span>
        </div>

        <!-- Stepper (Sudah Login variation only) -->
        <div v-if="userAuthStatus === 'SUDAH_LOGIN'" class="mt-5 pt-3 border-t border-gray-100 text-left relative pl-6 space-y-4">
          <!-- Vertical line -->
          <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-[#38bdf8]"></div>

          <!-- Step 1: Diterima (Active) -->
          <div class="relative">
            <div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#00669e] border-2 border-white flex items-center justify-center text-white">
              <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-xs font-bold text-gray-900">Diterima</p>
            <p class="text-[10px] text-gray-500">Laporan diterima di database Command Center.</p>
          </div>

          <!-- Step 2: Sedang Ditinjau -->
          <div class="relative">
            <div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#38bdf8]"></div>
            <p class="text-xs font-bold text-gray-900">Sedang Ditinjau</p>
            <p class="text-[10px] text-gray-500">Validasi manual oleh tim analitik.</p>
          </div>

          <!-- Step 3: Terkonfirmasi -->
          <div class="relative">
            <div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#38bdf8]"></div>
            <p class="text-xs font-bold text-gray-900">Terkonfirmasi</p>
            <p class="text-[10px] text-gray-500">Teknisi ditugaskan ke lokasi.</p>
          </div>

          <!-- Step 4: Ditutup -->
          <div class="relative">
            <div class="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#38bdf8]"></div>
            <p class="text-xs font-bold text-gray-900">Ditutup</p>
            <p class="text-[10px] text-gray-500">Perbaikan selesai dan aliran normal.</p>
          </div>
        </div>
      </div>

      <!-- Action Buttons Row -->
      <!-- VARIATION A: SUDAH LOGIN (Tutup brown button & Lacak Status sky button) -->
      <div v-if="userAuthStatus === 'SUDAH_LOGIN'" class="w-full mt-6 flex items-center space-x-3">
        <button
          type="button"
          @click="submitAnother"
          class="flex-1 py-3 rounded-xl bg-[#7c2d12] hover:bg-[#6c2810] active:scale-95 text-white text-xs font-semibold shadow transition"
        >
          Tutup
        </button>
        <button
          type="button"
          @click="goToTracking"
          class="flex-1 py-3 rounded-xl bg-[#bae6fd] hover:bg-[#a2d8f9] active:scale-95 text-gray-900 text-xs font-semibold shadow-xs transition"
        >
          Lacak Status
        </button>
      </div>

      <!-- VARIATION B: BELUM LOGIN (Submit Another Report & Login to View Full Analysis) -->
      <div v-else class="w-full mt-6 flex items-center space-x-3">
        <button
          type="button"
          @click="submitAnother"
          class="flex-1 py-3 rounded-xl bg-[#7c2d12] hover:bg-[#6c2810] active:scale-95 text-white text-xs font-semibold shadow transition"
        >
          Submit Another Report
        </button>
        <button
          type="button"
          @click="router.push('/login')"
          class="flex-1 py-3 rounded-xl bg-[#bae6fd] hover:bg-[#a2d8f9] active:scale-95 text-gray-900 text-xs font-semibold shadow-xs transition"
        >
          Login to View Full Analysis
        </button>
      </div>
    </div>

    <!-- OVERLAY: Peringatan Bahaya (Report Submitted (overlay).png) -->
    <div
      v-if="showWarningOverlay"
      class="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div class="w-full max-w-sm rounded-[28px] border border-[#ea580c]/30 bg-[#ffedd5] p-6 shadow-2xl text-center flex flex-col items-center">
        <!-- Big Alert Circle -->
        <div class="w-16 h-16 rounded-full bg-[#fed7aa] flex items-center justify-center mb-4 text-[#ea580c]">
          <div class="w-12 h-12 rounded-full border-2 border-[#ea580c] flex items-center justify-center">
            <span class="text-2xl font-bold text-[#ea580c]">!</span>
          </div>
        </div>

        <h2 class="text-lg font-bold text-gray-900 tracking-tight">Peringatan Bahaya</h2>
        <p class="text-xs text-gray-700 leading-relaxed mt-2 max-w-xs">
          Hasil Prediksi AI menunjukkan laporan anda masuk kategori <span class="font-bold text-[#ea580c]">High Risk (Skor: 92)</span>. Ini mengindikasikan kemungkinan kontaminasi pipa berat. Hindari mengonsumsi air PDAM hingga perbaikan selesai!
        </p>

        <button
          type="button"
          @click="closeOverlay"
          class="w-full mt-6 py-3 rounded-xl bg-[#7c2d12] hover:bg-[#6c2810] active:scale-95 text-white text-xs font-semibold shadow transition"
        >
          Mengerti
        </button>
      </div>
    </div>
  </div>
</template>
