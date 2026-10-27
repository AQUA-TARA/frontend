<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCitizenHistory, getTicket } from '@/api/client.js'

const router = useRouter()

// Selected ticket state: null = show List, or ticket object = show Detail
const selectedTicket = ref(null)
const loading = ref(false)
const error = ref('')

// Tickets list from backend
const tickets = ref([])

const mapStatusToColor = (status) => {
  switch (status) {
    case 'CLOSED':
      return { statusBg: '#0284c7', statusText: '#ffffff', riskType: 'low', riskLabel: 'Selesai' }
    case 'IN_PROGRESS':
      return { statusBg: '#fef08a', statusText: '#854d0e', riskType: 'high', riskLabel: 'High Risk' }
    case 'CONFIRMED':
      return { statusBg: '#fef08a', statusText: '#854d0e', riskType: 'mid', riskLabel: 'Mid Risk' }
    default:
      return { statusBg: '#e0f2fe', statusText: '#0369a1', riskType: 'low', riskLabel: 'Diterima' }
  }
}

const fetchHistory = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getCitizenHistory()
    if (res.success && Array.isArray(res.data)) {
      tickets.value = res.data.map(item => {
        const visual = mapStatusToColor(item.status)
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
        return {
          id: item.ticket_id || `AQT-REP-${item.report_id}`,
          date: dateStr,
          status: item.display_status || item.status,
          statusBg: visual.statusBg,
          statusText: visual.statusText,
          riskScore: item.risk_score || 50,
          riskType: visual.riskType,
          riskLabel: visual.riskLabel,
          snippet: item.description ? (item.description.slice(0, 32) + '...') : 'Laporan Kualitas Air',
          location: item.location || 'Kota Tarakan',
          description: item.description || 'Tidak ada deskripsi keluhan tambahan.',
          image: item.photo_url || '/assets/turbid_water.jpg',
          timeline: [
            { title: 'Diterima', desc: 'Laporan berhasil diterima ke portal publik.', done: true },
            { title: 'Sedang Ditinjau', desc: 'Korelasi dengan sensor pipa. Status: Verifikasi Teknis', done: item.status !== 'SUBMITTED', isBox: true },
            { title: 'Terkonfirmasi (Menunggu Dispatch)', desc: 'Teknisi ditugaskan ke lokasi perbaikan.', done: item.status === 'CONFIRMED' || item.status === 'IN_PROGRESS' || item.status === 'CLOSED' },
            { title: 'Ditutup', desc: 'Perbaikan selesai dan aliran normal.', done: item.status === 'CLOSED' }
          ]
        }
      })
    }
  } catch (err) {
    error.value = err.message || 'Gagal memuat riwayat laporan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})

const openTicket = async (t) => {
  selectedTicket.value = t
  if (t.id) {
    try {
      const detail = await getTicket(t.id)
      if (detail.success && detail.data) {
        selectedTicket.value.status = detail.data.display_status || detail.data.status
      }
    } catch (e) {
      // Keep initial
    }
  }
}

const backToList = () => {
  selectedTicket.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white via-white to-[#fed7aa]/30 px-5 py-3 font-sans pb-16">
    <!-- VIEW 1: TICKET LIST VIEW (Status Tracking Ticket (List).png) -->
    <div v-if="!selectedTicket && tickets.length > 0">
      <div class="mb-5">
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Riwayat Laporan</h1>
        <p class="text-xs text-gray-500 mt-1">Daftar semua laporan yang telah Anda kirimkan</p>
      </div>

      <!-- Ticket Cards List -->
      <div class="space-y-4">
        <div
          v-for="t in tickets"
          :key="t.id"
          @click="openTicket(t)"
          class="rounded-[20px] border-2 border-[#54b8ea] bg-[#e0f2fe]/40 p-4 transition-all hover:shadow-md cursor-pointer"
        >
          <!-- Top Row: ID Badge & Timestamp -->
          <div class="flex items-center justify-between">
            <span class="rounded-lg border border-[#54b8ea] bg-[#e0f2fe] px-3 py-1 font-mono text-xs font-semibold text-gray-800">
              {{ t.id }}
            </span>
            <div
              class="flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium"
              :class="t.riskType === 'low' ? 'bg-[#38bdf8] text-white' : 'bg-[#eab308] text-gray-900'"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ t.date }}</span>
            </div>
          </div>

          <!-- Middle Row: Snippet & Status pill -->
          <div class="flex items-center justify-between mt-3">
            <p class="text-xs text-gray-700 truncate max-w-[200px]">{{ t.snippet }}</p>
            <span
              class="rounded-full px-3 py-0.5 text-[11px] font-medium"
              :class="t.riskType === 'low' ? 'bg-[#00669e] text-white' : 'bg-[#fef08a] text-[#854d0e]'"
            >
              {{ t.status }}
            </span>
          </div>

          <div class="my-3 border-t border-[#54b8ea]/60"></div>

          <!-- Bottom Row: Risk Badge pill & Arrow link -->
          <div class="flex items-center justify-between">
            <!-- High Risk Pill -->
            <div
              v-if="t.riskType === 'high'"
              class="flex items-center space-x-2 rounded-full border border-[#ea580c] bg-white px-3 py-1 text-xs"
            >
              <div class="w-4 h-4 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-[10px]">
                !
              </div>
              <div class="leading-none">
                <span class="text-[9px] text-gray-500 block">High Risk</span>
                <span class="font-bold text-[#ea580c] text-xs">{{ t.riskScore }}/100</span>
              </div>
            </div>

            <!-- Mid Risk Pill -->
            <div
              v-else-if="t.riskType === 'mid'"
              class="flex items-center space-x-2 rounded-full border border-[#ca8a04] bg-white px-3 py-1 text-xs"
            >
              <div class="w-4 h-4 rounded-full bg-[#ca8a04] text-white flex items-center justify-center font-bold text-[10px]">
                !
              </div>
              <div class="leading-none">
                <span class="text-[9px] text-gray-500 block">Mid Risk</span>
                <span class="font-bold text-[#ca8a04] text-xs">{{ t.riskScore }}/100</span>
              </div>
            </div>

            <!-- Low Risk Pill -->
            <div
              v-else
              class="flex items-center space-x-2 rounded-full border border-[#0284c7] bg-white px-3 py-1 text-xs"
            >
              <div class="w-4 h-4 rounded-full bg-[#0284c7] text-white flex items-center justify-center font-bold text-[10px]">
                !
              </div>
              <div class="leading-none">
                <span class="text-[9px] text-gray-500 block">Low Risk</span>
                <span class="font-bold text-[#0284c7] text-xs">{{ t.riskScore }}/100</span>
              </div>
            </div>

            <!-- Blue arrow icon -->
            <svg class="w-5 h-5 text-[#00669e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: EMPTY STATE (Status Tracking Ticket (Empty List).png) -->
    <div v-else-if="!selectedTicket && tickets.length === 0">
      <div class="mb-5">
        <h1 class="text-xl font-bold text-gray-900 tracking-tight">Riwayat Laporan</h1>
        <p class="text-xs text-gray-500 mt-1">Daftar semua laporan yang telah Anda kirimkan</p>
      </div>

      <div class="mt-8 rounded-[24px] border border-gray-100 bg-white shadow-sm p-8 text-center flex flex-col items-center">
        <!-- Circular icon -->
        <div class="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4 text-[#94a3b8]">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <h2 class="text-base font-bold text-gray-900 mb-2">Belum Ada Laporan</h2>
        <p class="text-xs text-gray-500 leading-relaxed max-w-xs mb-6">
          Anda belum pernah mengirimkan laporan. Jika Anda menemukan kekeruhan air di lokasi anda, harap segera laporkan agar kami dapat menyelidikinya.
        </p>

        <button
          type="button"
          @click="router.push('/')"
          class="w-full max-w-xs py-3 rounded-xl bg-[#00669e] text-white text-xs font-semibold hover:bg-[#00527f] transition shadow-md"
        >
          Buat Laporan Baru
        </button>
      </div>
    </div>

    <!-- VIEW 3: TICKET DETAIL VIEW (High / Mid / Low) -->
    <div v-else-if="selectedTicket">
      <!-- Back button -->
      <button
        type="button"
        @click="backToList"
        class="flex items-center space-x-1.5 text-xs text-gray-700 hover:text-black mb-4 font-medium"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Kembali</span>
      </button>

      <!-- Main Detail Card -->
      <div class="rounded-[22px] border-2 border-[#54b8ea] bg-[#e0f2fe]/40 p-4 shadow-sm">
        <p class="text-xs text-gray-600 font-medium">Detail Laporan</p>
        <h1 class="text-2xl font-bold font-mono text-gray-900 tracking-tight mt-0.5 mb-3">{{ selectedTicket.id }}</h1>

        <!-- Header Two-Column Box: Risk Score & Status -->
        <div class="rounded-xl border border-[#54b8ea] bg-[#e0f2fe] p-2.5 flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3 pl-2">
            <div>
              <p class="text-[9px] text-gray-600 font-medium">Risk Score</p>
              <div class="flex items-center space-x-2 mt-0.5">
                <span
                  class="text-base font-bold"
                  :class="selectedTicket.riskType === 'high' ? 'text-[#ea580c]' : selectedTicket.riskType === 'mid' ? 'text-[#ca8a04]' : 'text-[#0284c7]'"
                >
                  {{ selectedTicket.riskScore }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                  :class="selectedTicket.riskType === 'high' ? 'bg-[#ea580c] text-white' : selectedTicket.riskType === 'mid' ? 'bg-[#ca8a04] text-white' : 'bg-[#0284c7] text-white'"
                >
                  {{ selectedTicket.riskLabel }}
                </span>
              </div>
            </div>
          </div>

          <div class="border-l border-[#54b8ea] pl-4 pr-2">
            <p class="text-[9px] text-gray-600 font-medium">Status</p>
            <span
              class="inline-block mt-0.5 rounded-full px-3 py-1 text-[11px] font-medium"
              :class="selectedTicket.riskType === 'low' ? 'bg-[#00669e] text-white' : 'bg-[#fef08a] text-[#854d0e]'"
            >
              {{ selectedTicket.status }}
            </span>
          </div>
        </div>

        <!-- Detail Laporan Inner Box -->
        <div class="rounded-2xl border border-[#54b8ea] bg-white p-4 mb-4">
          <div class="flex items-center space-x-2 border-b border-[#54b8ea] pb-2 mb-3">
            <svg class="w-4 h-4 text-[#00669e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 class="text-xs font-bold text-gray-800">Detail Laporan</h2>
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-[10px] text-gray-500">Waktu Lapor</p>
              <p class="text-xs font-semibold text-gray-800">{{ selectedTicket.date }}</p>
            </div>

            <div>
              <p class="text-[10px] text-gray-500">Lokasi</p>
              <p class="text-xs font-semibold text-gray-800">{{ selectedTicket.location }}</p>
            </div>

            <div>
              <p class="text-[10px] text-gray-500">Deskripsi</p>
              <p class="text-xs text-gray-700 leading-relaxed">{{ selectedTicket.description }}</p>
            </div>

            <!-- Turbid Water Image -->
            <div class="pt-1">
              <img
                :src="selectedTicket.image"
                alt="Foto Keran Air"
                class="w-full h-36 object-cover rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>

        <!-- Timeline Proses Section -->
        <div>
          <div class="flex items-center space-x-1.5 mb-3">
            <svg class="w-4 h-4 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xs font-bold text-gray-800">Timeline Proses</h3>
          </div>

          <div class="relative pl-6 space-y-4">
            <!-- Vertical Line -->
            <div class="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#54b8ea]"></div>

            <!-- Steps -->
            <div
              v-for="(step, sIdx) in selectedTicket.timeline"
              :key="sIdx"
              class="relative"
            >
              <!-- Node circle -->
              <div
                class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                :class="step.done ? 'bg-[#00669e] border-white text-white' : 'bg-white border-[#54b8ea] text-[#54b8ea]'"
              >
                <svg v-if="step.done" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <!-- Content -->
              <div v-if="!step.isBox">
                <p class="text-xs font-bold text-gray-900">{{ step.title }}</p>
                <p class="text-[10px] text-gray-500 mt-0.5">{{ step.desc }}</p>
              </div>

              <!-- Content in Special Box (Sedang Ditinjau) -->
              <div
                v-else
                class="rounded-xl border border-[#00669e] bg-[#e0f2fe]/60 p-2.5"
              >
                <div class="flex items-center space-x-1.5 mb-1">
                  <svg class="w-3.5 h-3.5 text-[#00669e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p class="text-xs font-bold text-gray-900">{{ step.title }}</p>
                </div>
                <p class="text-[10px] text-gray-700 leading-snug">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
