<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TriageModal from '../../components/admin/TriageModal.vue'
import { ticketService } from '@/services/ticketService'

// Demo tickets data consistent with Dashboard demoData
const demoData = {
  urgent_tickets: [
    {
      cluster_id: 'AQT-CLUSTER-005',
      gabungan_count: 4,
      lokasi: 'Zona Tarakan Tengah (Jl. Sudirman)',
      turbidity: 95,
      risk_score: 95,
      pipe_pressure: 2.8,
      status: 'SUBMITTED'
    },
    {
      cluster_id: 'AQT-CLUSTER-001',
      gabungan_count: 3,
      lokasi: 'Zona Tarakan Timur (Perum. Juata)',
      turbidity: 85,
      risk_score: 94,
      status: 'SUBMITTED'
    },
    {
      ticket_id: 101,
      ticket_code: 'AQT-261018-0001',
      lokasi: 'Zona Tarakan Utara (Kp. Bugis)',
      turbidity: 90,
      risk_score: 91,
      status: 'SUBMITTED'
    },
    {
      cluster_id: 'AQT-CLUSTER-007',
      gabungan_count: 12,
      lokasi: 'Zona Tarakan Timur (Mamburungan)',
      turbidity: 81,
      risk_score: 89,
      status: 'IN_PROGRESS'
    },
    {
      cluster_id: 'AQT-CLUSTER-003',
      gabungan_count: 5,
      lokasi: 'Zona Tarakan Barat (Karang Anyar)',
      turbidity: 71,
      risk_score: 88,
      status: 'IN_PROGRESS'
    },
    {
      cluster_id: 'AQT-CLUSTER-004',
      gabungan_count: 3,
      lokasi: 'Zona Tarakan Timur (Pamusian)',
      turbidity: 76,
      risk_score: 85,
      status: 'CONFIRMED'
    },
    {
      ticket_id: 102,
      ticket_code: 'AQT-261019-0001',
      lokasi: 'Zona Tarakan Tengah (Pasar Beringin)',
      turbidity: 78,
      risk_score: 82,
      status: 'IN_REVIEW'
    },
    {
      ticket_id: 103,
      ticket_code: 'AQT-261020-0001',
      lokasi: 'Zona Tarakan Barat (Sebengkok)',
      turbidity: 73,
      risk_score: 79,
      status: 'SUBMITTED'
    },
    {
      ticket_id: 104,
      ticket_code: 'AQT-261021-0001',
      lokasi: 'Zona Tarakan Utara (Juata Laut)',
      turbidity: 74,
      risk_score: 77,
      status: 'IN_REVIEW'
    },
    {
      ticket_id: 105,
      ticket_code: 'AQT-261021-0002',
      lokasi: 'Zona Tarakan Timur (Lingkas Ujung)',
      turbidity: 72,
      risk_score: 75,
      status: 'SUBMITTED'
    }
  ]
}


const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const tickets = ref([])
const selectedTicket = ref(null)

// Filters: search query & date range
const searchQuery = ref(route.query.q ? String(route.query.q) : '')
const startDate = ref('')
const endDate = ref('')

// 4 Filter tabs matching Ticket.png
const currentTab = ref('Semua Laporan')
const tabs = computed(() => {
  const total = tickets.value.length;
  const needTriage = tickets.value.filter(t => t.status === 'SUBMITTED' || t.status === 'IN_REVIEW').length;
  const inProgress = tickets.value.filter(t => t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS').length;
  const selesai = tickets.value.filter(t => t.status === 'CLOSED').length;
  return [
    { name: 'Semua Laporan', icon: 'clipboard', count: total },
    { name: 'Perlu Triage', icon: 'exclamation', count: needTriage },
    { name: 'Sedang Dikerjakan', icon: 'clock', count: inProgress },
    { name: 'Selesai', icon: 'check', count: selesai }
  ];
});

// Helper to map backend tickets cleanly
const mapTicketItem = (item) => {
  const report = item.report || {}
  const publicTicketId =
  item.ticket_code ??
  item.ticket?.ticket_code ??
  null

  const numericTicketId =
    item.ticket_id ??
    item.ticket?.id ??
    null

  // Format coordinate string or location description
  let locationStr = 'Lokasi tidak tersedia'
  if (report.latitude && report.longitude) {
    locationStr = `${report.latitude}, ${report.longitude}`
  } else if (item.lokasi) {
    locationStr = item.lokasi
  }

  const keluhanStr = report.description || item.keluhan || 'Tidak ada keterangan keluhan'
  const turbidityVal = item.turbidity != null && item.turbidity !== '' ? item.turbidity : '-'
  const riskVal = item.risk_score != null && item.risk_score !== '' ? item.risk_score : '-'

  return {
    ...item,
    id: item.id,
    report_id: item.report_id,
    ticket_id: numericTicketId,
    ticket_code: publicTicketId,
    cluster_code: item.cluster_code || null,
    keluhan: keluhanStr,
    lokasi: locationStr,
    turbidity: turbidityVal,
    risk_score: riskVal,
    canTriage: item.status === 'SUBMITTED' || item.status === 'IN_REVIEW',
    report: report,
    gabungan_count: item.gabungan_count || (item.cluster_code ? 1 : null)
  }
}

const fetchTickets = async () => {
  try {
    loading.value = true
    const params = {}
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (searchQuery.value && searchQuery.value.trim()) {
      params.q = searchQuery.value.trim()
    }
    const rawData = await ticketService.filter(params)
    const list = Array.isArray(rawData) ? rawData : (rawData?.data && Array.isArray(rawData.data) ? rawData.data : [])
    const fetched = list.map(mapTicketItem)
    // Merge demo tickets with fetched tickets, avoiding duplicates
    const demo = demoData.urgent_tickets || []
    const seen = new Set()
    const merged = []
    // Add demo tickets first
    for (const d of demo) {
      const id = d.cluster_id
        ? `cluster:${d.cluster_id}`
        : d.ticket_code
          ? `ticket:${d.ticket_code}`
          : `id:${d.ticket_id}`
      if (!seen.has(id)) {
        seen.add(id)
        merged.push(d)
      }
    }
    // Add fetched tickets
    for (const f of fetched) {
      const id = f.cluster_id
        ? `cluster:${f.cluster_id}`
        : f.ticket_code
          ? `ticket:${f.ticket_code}`
          : f.ticket_id != null
            ? `id:${f.ticket_id}`
            : `report:${f.report_id ?? f.id}`
      if (!seen.has(id)) {
        seen.add(id)
        merged.push(f)
      }
    }
    tickets.value = merged
    error.value = null
  } catch (err) {
    error.value = err.message || 'Gagal memuat tiket laporan'
    tickets.value = []
  } finally {
    loading.value = false
  }
}

const applySearch = () => {
  const q = searchQuery.value ? searchQuery.value.trim() : ''
  router.replace({ query: { ...route.query, q: q || undefined } })
  fetchTickets()
}

const clearSearch = () => {
  searchQuery.value = ''
  applySearch()
}

watch(() => route.query.q, (newQ) => {
  const nextVal = newQ ? String(newQ) : ''
  if (nextVal !== searchQuery.value) {
    searchQuery.value = nextVal
    fetchTickets()
  }
})

onMounted(() => {
  // Show demo tickets immediately
  tickets.value = demoData.urgent_tickets || []
  fetchTickets()
})

const filteredTickets = computed(() => {
  let list = tickets.value

  // Status tab filter
  if (currentTab.value === 'Perlu Triage') {
    list = list.filter(t => t.status === 'SUBMITTED' || t.status === 'IN_REVIEW')
  } else if (currentTab.value === 'Sedang Dikerjakan') {
    list = list.filter(t => t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS')
  } else if (currentTab.value === 'Selesai') {
    list = list.filter(t => t.status === 'CLOSED')
  }

  return list
})

const getStatusBadgeStyle = (ticket) => {
  if (ticket.statusColor) return ticket.statusColor
  switch (ticket.status) {
    case 'SUBMITTED':
      return 'bg-[#38bdf8] text-white'
    case 'IN_REVIEW':
      return 'bg-[#fde047] text-slate-900'
    case 'CONFIRMED':
      return 'bg-[#ea580c] text-white'
    case 'IN_PROGRESS':
      return 'bg-[#cbd5e1] text-slate-700'
    case 'CLOSED':
      return 'bg-[#22c55e] text-white'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}

const formatStatusText = (ticket) => {
  if (ticket.customStatusText) return ticket.customStatusText
  switch (ticket.status) {
    case 'SUBMITTED': return 'Tersubmit'
    case 'IN_REVIEW': return 'Sedang Ditinjau'
    case 'CONFIRMED': return 'Terkonfirmasi'
    case 'IN_PROGRESS': return 'Sedang Diperbaiki'
    case 'CLOSED': return 'Selesai'
    default: return ticket.status
  }
}

const openTriage = (ticket) => {
  selectedTicket.value = ticket
}

const onTriageConfirmed = () => {
  fetchTickets()
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6 text-slate-900 font-sans">
    
    <!-- Title & Date Filter Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">Report Ticket</h1>
        <p class="text-sm text-slate-600 mt-1">Manage and triage incoming reports from customers.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 sticky top-0 z-20 p-2">


        <!-- Date Range Box -->
        <div class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 rounded-lg text-xs md:text-sm font-medium text-slate-800">
          <input type="date" v-model="startDate" class="border border-slate-300 rounded p-1 text-xs" />
          <span class="text-slate-500 text-xs">to</span>
          <input type="date" v-model="endDate" class="border border-slate-300 rounded p-1 text-xs" />
          <button @click="fetchTickets" class="ml-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors">Apply</button>
        </div>
      </div>
    </div>

    <!-- 4 Filter Tabs row matching reference -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Tab 1: Semua Laporan -->
      <button 
        @click="currentTab = 'Semua Laporan'"
        class="bg-white border-2 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all text-left"
        :class="currentTab === 'Semua Laporan' ? 'border-[#54b8ea] ring-1 ring-[#54b8ea]' : 'border-slate-300 hover:border-slate-400'"
      >
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-slate-900">Semua Laporan</span>
        </div>
        <span class="text-sm font-bold text-slate-900">{{ tabs[0].count }}</span>
      </button>

      <!-- Tab 2: Perlu Triage -->
      <button 
        @click="currentTab = 'Perlu Triage'"
        class="bg-white border-2 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all text-left"
        :class="currentTab === 'Perlu Triage' ? 'border-[#54b8ea] ring-1 ring-[#54b8ea]' : 'border-slate-300 hover:border-slate-400'"
      >
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="9" stroke-width="2" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <span class="text-xs font-bold text-slate-900">Perlu Triage</span>
        </div>
        <span class="text-sm font-bold text-slate-900">{{ tabs[1].count }}</span>
      </button>

      <!-- Tab 3: Sedang Dikerjakan -->
      <button 
        @click="currentTab = 'Sedang Dikerjakan'"
        class="bg-white border-2 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all text-left"
        :class="currentTab === 'Sedang Dikerjakan' ? 'border-[#54b8ea] ring-1 ring-[#54b8ea]' : 'border-slate-300 hover:border-slate-400'"
      >
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="text-xs font-bold text-slate-900">Sedang Dikerjakan</span>
        </div>
        <span class="text-sm font-bold text-slate-900">{{ tabs[2].count }}</span>
      </button>

      <!-- Tab 4: Selesai -->
      <button 
        @click="currentTab = 'Selesai'"
        class="bg-white border-2 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all text-left"
        :class="currentTab === 'Selesai' ? 'border-[#54b8ea] ring-1 ring-[#54b8ea]' : 'border-slate-300 hover:border-slate-400'"
      >
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span class="text-xs font-bold text-slate-900">Selesai</span>
        </div>
        <span class="text-sm font-bold text-slate-900">{{ tabs[3].count }}</span>
      </button>

    </div>

    <!-- Table Container -->
    <!-- Table Container with states -->
<div v-if="loading" class="flex justify-center items-center py-8">
  <span class="text-gray-500">Memuat laporan...</span>
</div>
<div v-else-if="error" class="bg-red-100 text-red-800 p-4 rounded mb-4">
  <span>Error: {{ error }}</span>
</div>
<div v-else-if="tickets.length === 0" class="p-4 text-center text-gray-500">
  Tidak ada laporan.
</div>
<div v-else class="bg-white border-2 border-[#54b8ea] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-700/60 text-[11px] font-bold text-slate-900 tracking-wider">
              <th class="px-6 py-4">TICKET ID</th>
              <th class="px-6 py-4">KELUHAN & LOKASI</th>
              <th class="px-6 py-4 text-center">TURBIDITY SCORE</th>
              <th class="px-6 py-4 text-center">RISK SCORE</th>
              <th class="px-6 py-4 text-center">STATUS</th>
              <th class="px-6 py-4 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs text-slate-800">
            <tr 
              v-for="ticket in filteredTickets" 
              :key="ticket.ticket_id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <!-- Ticket ID + Cluster badge -->
              <td class="px-6 py-4 align-middle">
                <div class="font-bold text-slate-900 font-mono tracking-tight">
                  {{ ticket.cluster_id || ticket.ticket_code || ticket.ticket_id || 'ID tidak tersedia' }}
                </div>
                <div 
                  v-if="ticket.cluster_code"
                  class="mt-1 inline-flex items-center px-2 py-0.5 rounded border border-amber-600 text-[10px] text-amber-800 bg-amber-50 font-semibold"
                >
                  Cluster: {{ ticket.cluster_code }}
                </div>
                <div 
                  v-else-if="ticket.gabungan_count"
                  class="mt-1 inline-flex items-center px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-700 bg-white"
                >
                  {{ ticket.gabungan_count }} Laporan Gabungan
                </div>
              </td>

              <!-- Keluhan & Lokasi -->
              <td class="px-6 py-4 align-middle max-w-sm">
                <div class="font-bold text-slate-900 text-xs leading-relaxed truncate">{{ ticket.keluhan }}</div>
                <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="truncate">{{ ticket.lokasi }}</span>
                </div>
              </td>

              <!-- Turbidity Score with rounded pill box -->
              <td class="px-6 py-4 text-center align-middle">
                <div class="inline-flex items-center px-3 py-1 rounded-md border border-slate-700 text-xs font-bold text-slate-900 bg-white">
                  {{ ticket.turbidity !== '-' && ticket.turbidity !== undefined && ticket.turbidity !== null ? `${ticket.turbidity} NTU` : '—' }}
                </div>
              </td>

              <!-- Risk Score with exclamation circle -->
              <td class="px-6 py-4 text-center align-middle">
                <div class="inline-flex items-center gap-1.5 font-bold text-rose-500">
                  <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" stroke-width="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{{ ticket.risk_score !== '-' && ticket.risk_score !== undefined && ticket.risk_score !== null ? ticket.risk_score : '—' }}</span>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="px-6 py-4 text-center align-middle">
                <span 
                  class="inline-block px-4 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  :class="getStatusBadgeStyle(ticket)"
                >
                  {{ formatStatusText(ticket) }}
                </span>
              </td>

              <!-- Aksi button: Eye icon + Triage or View -->
              <td class="px-6 py-4 text-center align-middle">
                <button 
                  @click="openTriage(ticket)"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800 hover:text-blue-600 transition-colors"
                >
                  <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ ticket.canTriage ? 'Triage' : 'View' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Triage Modal Component -->
    <TriageModal 
      v-if="selectedTicket" 
      :ticket="selectedTicket"
      :ticket-id="selectedTicket.ticket_id" 
      @close="selectedTicket = null"
      @confirmed="onTriageConfirmed"
    />

  </div>
</template>
