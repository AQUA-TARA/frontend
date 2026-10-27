<script setup>
import { API_BASE } from '@/api/client'
import { ref, onMounted, onUnmounted } from 'vue'
import { ticketService } from '@/services/ticketService'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Fallback demo data exactly reproducing the visual data in Dashboard.png
const demoData = {
  total_laporan_hari_ini: 24,
  rata_rata_kekeruhan: 45,
  active_maintenance: 5,
  system_uptime: 99.9,
  tren_laporan: {
    labels: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    data: [5, 6, 8, 12, 14, 7, 6]
  },
  kekeruhan_per_zona: {
    labels: ['Tengah', 'Timur', 'Barat', 'Utara'],
    data: [35, 12, 78, 55]
  },
  urgent_tickets: [
    {
      cluster_id: 'AQT-CLUSTER-005',
      gabungan_count: 4,
      lokasi: 'Zona Tarakan Tengah (Jl. Sudirman)',
      turbidity: 95,
      risk_score: 95,
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

const router = useRouter()
const loading = ref(true) // show loading spinner initially
const error = ref(null)
const dashboardData = ref(demoData) // initialize with demo data
const isDemo = ref(false)

// Download CSV report of tickets
const downloadReport = async () => {
  try {
    const blob = await ticketService.downloadReport();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report_tickets.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed', e);
    alert('Gagal mengunduh laporan');
  }
};

let pollInterval = null


const fetchDashboardData = async () => {
  try {
    const { authService } = await import('@/services/authService')
    const token = authService.session.value?.access_token

    const headers = {
      Accept: 'application/json',
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
      method: 'GET',
      headers,
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(
        json?.message ||
        json?.error?.message ||
        `Gagal memuat dashboard (HTTP ${res.status})`
      )
    }

    if (json?.success && json?.data) {
      dashboardData.value = {
        ...demoData,
        ...json.data,
        urgent_tickets: json.data.urgent_tickets?.length
          ? json.data.urgent_tickets
          : [],
      }

      error.value = null
      isDemo.value = false
    } else {
      throw new Error(
        json?.error?.message || json?.message || 'Format data dashboard tidak valid'
      )
    }
  } catch (err) {
    error.value = err.message
    console.error('Gagal memuat dashboard admin:', err)

    dashboardData.value = demoData
    isDemo.value = true
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  fetchDashboardData()
  pollInterval = setInterval(fetchDashboardData, 180000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

// Line chart options matching reference
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      min: 0,
      max: 20,
      ticks: { stepSize: 5, color: '#64748b', font: { size: 10 } },
      grid: { color: '#e2e8f0', borderDash: [3, 3] }
    },
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { display: false }
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { stepSize: 25, color: '#64748b', font: { size: 10 } },
      grid: { color: '#e2e8f0', borderDash: [3, 3] }
    },
    x: {
      ticks: { color: '#64748b', font: { size: 10 } },
      grid: { display: false }
    }
  }
}

const getLineChartData = () => {
  if (!dashboardData.value?.tren_laporan) return null
  return {
    labels: dashboardData.value.tren_laporan.labels,
    datasets: [
      {
        label: 'Laporan Masuk',
        data: dashboardData.value.tren_laporan.data,
        borderColor: '#818cf8',
        backgroundColor: 'rgba(129, 140, 248, 0.15)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.45,
        fill: true
      }
    ]
  }
}

const getBarChartData = () => {
  if (!dashboardData.value?.kekeruhan_per_zona) return null
  return {
    labels: dashboardData.value.kekeruhan_per_zona.labels,
    datasets: [
      {
        label: 'Kekeruhan Air',
        data: dashboardData.value.kekeruhan_per_zona.data,
        backgroundColor: '#818cf8',
        borderRadius: 0,
        barThickness: 54
      }
    ]
  }
}

const formatStatusText = (status) => {
  switch (status) {
    case 'SUBMITTED': return 'Tersubmit'
    case 'IN_REVIEW': return 'Sedang Ditinjau'
    case 'CONFIRMED': return 'Terkonfirmasi'
    case 'IN_PROGRESS': return 'Sedang Diperbaiki'
    case 'CLOSED': return 'Selesai'
    default: return status
  }
}

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return 'bg-[#47b1e8] text-white'
    case 'IN_REVIEW':
      return 'bg-[#fcd34d] text-slate-800'
    case 'CONFIRMED':
      return 'bg-[#d97706] text-white'
    case 'IN_PROGRESS':
      return 'bg-[#cbd5e1] text-slate-700'
    case 'CLOSED':
      return 'bg-[#22c55e] text-white'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}
</script>

<template>
  <div class="relative p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6 text-slate-900 font-sans">
  <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
    <svg class="animate-spin h-6 w-6 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <span class="ml-2 text-sm text-slate-600">Memuat data dashboard...</span>
  </div>
    
    <!-- Title & Action Button -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">Command Dashboard</h1>
        <p class="text-sm text-slate-600 mt-1">Ringkasan Eksekutif & Pemantauan Operasional Harian</p>
      </div>

      <button @click="downloadReport" class="px-5 py-2 bg-white border border-slate-700 rounded-lg text-xs md:text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-sm">
        Unduh Laporan
      </button>
    </div>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      
      <!-- Card 1: Total Laporan Hari Ini -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-slate-700">Total Laporan Hari Ini</span>
          <div class="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ dashboardData?.total_laporan_hari_ini ?? 24 }}
          </div>
          <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-medium text-slate-700">
            +5 dari kemarin
          </div>
        </div>
      </div>

      <!-- Card 2: Rata-rata Kekeruhan -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden cursor-pointer" @click="router.push('/admin/nodes')">
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-slate-700">Rata-rata Kekeruhan</span>
          <div class="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-800">
            <!-- Wavy line icon -->
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10c2.5-3 5.5-3 8 0s5.5 3 8 0m-16 4c2.5-3 5.5-3 8 0s5.5 3 8 0" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ dashboardData?.rata_rata_kekeruhan ?? 45 }} <span class="text-xl font-bold">NTU</span>
          </div>
          <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-medium text-slate-700">
            1 Zona Kritis
          </div>
        </div>
      </div>

      <!-- Card 3: Active Maintenance -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-slate-700">Active Maintenance</span>
          <div class="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ dashboardData?.active_maintenance ?? 5 }}
          </div>
          <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-medium text-slate-700">
            2 Regu Lapangan
          </div>
        </div>
      </div>

      <!-- Card 4: System Uptime -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div class="flex items-start justify-between">
          <span class="text-xs font-medium text-slate-700">System Uptime</span>
          <div class="w-9 h-9 rounded-lg border border-slate-700 flex items-center justify-center text-slate-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-3xl font-extrabold text-slate-900 tracking-tight">
            99.9%
          </div>
          <div class="mt-2 inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-medium text-slate-700">
            Semua Node Aktif
          </div>
        </div>
      </div>

    </div>

    <!-- Analytics Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Chart 1: Tren Laporan Masuk -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div>
              <h2 class="text-sm font-bold text-slate-900">Tren Laporan Masuk</h2>
              <p class="text-xs text-slate-500">Fluktuasi Jumlah Tiket Selama 7 Hari Terakhir</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-700 rounded-lg text-xs font-medium text-slate-700 bg-white">
            <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>7 Hari Terakhir</span>
            <svg class="w-3 h-3 text-slate-500 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div class="h-60 w-full mt-2">
          <Line v-if="getLineChartData()" :data="getLineChartData()" :options="lineChartOptions" />
        </div>

        <div class="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600">
          <span class="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></span>
          <span>Laporan Masuk</span>
        </div>
      </div>

      <!-- Chart 2: Kekeruhan per Zona -->
      <div class="bg-white border-2 border-[#54b8ea] rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <!-- Crosshair / compass target icon -->
          <svg class="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div>
            <h2 class="text-sm font-bold text-slate-900">Kekeruhan per Zona</h2>
            <p class="text-xs text-slate-500">Rata-rata NTU dari Node IoT</p>
          </div>
        </div>

        <div class="h-60 w-full mt-2">
          <Bar v-if="getBarChartData()" :data="getBarChartData()" :options="barChartOptions" />
        </div>

        <div class="flex items-center justify-center gap-2 mt-4 text-xs text-slate-600">
          <span class="w-2.5 h-2.5 bg-[#818cf8]"></span>
          <span>Kekeruhan Air</span>
        </div>
      </div>

    </div>

    <!-- Urgent Tickets Table -->
    <div class="bg-white border-2 border-[#54b8ea] rounded-xl shadow-sm overflow-hidden">
      <!-- Table Header Bar -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-slate-700/60">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <div>
            <h2 class="text-sm font-bold text-slate-900">Urgent Tickets</h2>
            <p class="text-[11px] text-slate-500">Daftar Laporan Prioritas Tinggi dengan Skor Risiko Tertinggi yang Membutuhkan Tindakan Segera.</p>
          </div>
        </div>

        <RouterLink 
          to="/admin/report" 
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-colors"
        >
          <span>View All Tickets</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </RouterLink>
      </div>

      <!-- Table Content -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-700/60 text-[11px] font-bold text-slate-900 tracking-wider">
              <th class="px-6 py-3.5">TICKET ID</th>
              <th class="px-6 py-3.5">LOKASI LAPORAN</th>
              <th class="px-6 py-3.5 text-center">TURBIDITY SCORE</th>
              <th class="px-6 py-3.5 text-center">RISK SCORE</th>
              <th class="px-6 py-3.5 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-xs text-slate-800">
            <tr 
              v-for="ticket in dashboardData?.urgent_tickets" 
              :key="ticket.ticket_id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <!-- Ticket ID + cluster badge -->
              <td class="px-6 py-3.5">
                <div class="font-bold text-slate-900">{{ ticket.cluster_id }}</div>
                <div class="font-bold text-slate-900">{{ ticket.ticket_code }}</div>
                <div 
                  v-if="ticket.gabungan_count"
                  class="mt-1 inline-flex items-center px-2 py-0.5 rounded border border-slate-700 text-[10px] text-slate-700 bg-white"
                >
                  {{ ticket.gabungan_count }} Laporan Gabungan
                </div>
              </td>

              <!-- Lokasi -->
              <td class="px-6 py-3.5 font-medium text-slate-700">
                {{ ticket.lokasi }}
              </td>

              <!-- Turbidity Score with rounded pill box -->
              <td class="px-6 py-3.5 text-center">
                <div class="inline-flex items-center px-3 py-1 rounded-md border border-slate-700 text-xs font-bold text-slate-900 bg-white">
                  {{ ticket.turbidity }} NTU
                </div>
              </td>

              <!-- Risk Score with exclamation mark in circle icon and red text -->
              <td class="px-6 py-3.5 text-center">
                <div class="inline-flex items-center gap-1.5 font-bold text-rose-500">
                  <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" stroke-width="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{{ ticket.risk_score !== '-' && ticket.risk_score !== undefined && ticket.risk_score !== null ? ticket.risk_score : '—' }}</span>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="px-6 py-3.5 text-center">
                <span 
                  class="inline-block px-4 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  :class="getStatusBadgeStyle(ticket.status)"
                >
                  {{ formatStatusText(ticket.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>
