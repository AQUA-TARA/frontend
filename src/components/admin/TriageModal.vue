<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  },
  ticket: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'confirmed'])

const loading = ref(false)
const selectedDecision = ref(null) // 'valid' | 'false_positive'
const confirming = ref(false)

import { ticketService } from '@/services/ticketService'

const errorMessage = ref(null)
const successMessage = ref(null)

// Map backend status transitions according to AdminTicketController.php
// SUBMITTED   => IN_REVIEW
// IN_REVIEW   => CONFIRMED
// CONFIRMED   => IN_PROGRESS
// IN_PROGRESS => CLOSED
const getNextStatusForTicket = () => {
  const currentStatus = props.ticket?.status || 'SUBMITTED'
  switch (currentStatus) {
    case 'SUBMITTED':
      return 'IN_REVIEW'
    case 'IN_REVIEW':
      return 'CONFIRMED'
    case 'CONFIRMED':
      return 'IN_PROGRESS'
    case 'IN_PROGRESS':
      return 'CLOSED'
    default:
      return null
  }
}

// Initialize triageData from ticket prop if available
const triageData = ref({
  ticket_id: props.ticket?.ticket_id || props.ticketId || 'AQT-TICKET',
  risk_score: props.ticket?.risk_score ?? '-',
  pelapor: props.ticket?.report?.user?.name || (props.ticket?.gabungan_count ? `${props.ticket.gabungan_count} Laporan Gabungan` : 'Laporan Warga'),
  keluhan: props.ticket?.keluhan || props.ticket?.report?.description || 'Tidak ada keterangan keluhan.',
  lokasi: props.ticket?.lokasi || (props.ticket?.report?.latitude && props.ticket?.report?.longitude ? `${props.ticket.report.latitude}, ${props.ticket.report.longitude}` : 'Lokasi tidak diketahui'),
  waktu: props.ticket?.created_at ? new Date(props.ticket.created_at).toLocaleString('id-ID') : 'Baru saja',
  photo_url: props.ticket?.report?.photo_url || props.ticket?.report?.photo_path || 'https://images.unsplash.com/photo-1584771145729-0bd9fda6529b?auto=format&fit=crop&w=400&q=80',
  iot_nearest: {
    node_id: props.ticket?.node_id || 'T-Tengah_05',

      turbidity:
        props.ticket?.turbidity != null &&
        props.ticket?.turbidity !== '-'
          ? `${props.ticket.turbidity} NTU`
          : '-',

      pressure: props.ticket?.pipe_pressure ?? '-',
      pressure_unit: 'bar',

      status: props.ticket?.status || 'SUBMITTED'
  },
  audit_trail: [
    {
      time: props.ticket?.created_at ? new Date(props.ticket.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '00:00',
      source: 'SYSTEM (APP)',
      title: `Tiket #${props.ticket?.ticket_id || props.ticketId} dibuat untuk laporan warga.`
    }
  ],
  rekomendasi: 'Lakukan verifikasi dan koordinasi ke tim lapangan untuk pengecekan lokasi pipa terkait keluhan air.'
})

onMounted(() => {
  if (props.ticket) {
    triageData.value.ticket_id = props.ticket.ticket_id || props.ticketId;
    triageData.value.risk_score = props.ticket.risk_score ?? '-';
    triageData.value.keluhan = props.ticket.keluhan || props.ticket.report?.description || 'Tidak ada keterangan keluhan.';
    triageData.value.lokasi = props.ticket.lokasi || (props.ticket.report?.latitude && props.ticket.report?.longitude ? `${props.ticket.report.latitude}, ${props.ticket.report.longitude}` : 'Lokasi tidak diketahui');
    if (props.ticket.report?.photo_url || props.ticket.report?.photo_path) {
      triageData.value.photo_url = props.ticket.report.photo_url || props.ticket.report.photo_path;
    }
    triageData.value.iot_nearest.pressure = props.ticket.pipe_pressure ?? '-';
    triageData.value.iot_nearest.pressure_unit = 'bar'
  }
})

const handleSelect = (decision) => {
  errorMessage.value = null
  selectedDecision.value = decision
}

const cancelSelection = () => {
  selectedDecision.value = null
  errorMessage.value = null
}

const getSensorStatus = (turbidity) => {
  if (turbidity == null || turbidity === '-') {
    return 'UNKNOWN'
  }

  const value = Number(turbidity)

  if (!Number.isFinite(value) || value < 0) {
    return 'UNKNOWN'
  }

  if (value <= 5) return 'NORMAL'
  if (value <= 25) return 'WARNING'
  if (value <= 50) return 'HIGH'

  return 'CRITICAL'
}

const submitDecision = async () => {
  errorMessage.value = null

  try {
    confirming.value = true

    // Status tiket dan status sensor adalah dua hal berbeda.
    const current = props.ticket?.status

    // Aturan transisi status tiket dari backend:
    // SUBMITTED => IN_REVIEW
    // IN_REVIEW => CONFIRMED
    // CONFIRMED => IN_PROGRESS
    // IN_PROGRESS => CLOSED

    let statusPayload = null

    if (current === 'SUBMITTED') {
      statusPayload = 'IN_REVIEW'
    } else {
      statusPayload = getNextStatusForTicket()
    }

    if (!statusPayload) {
      throw new Error(
        `Tidak ada transisi lanjutan untuk status tiket '${current}'.`
      )
    }

    const idToUpdate = props.ticket?.id || props.ticketId

    if (!idToUpdate) {
      throw new Error('ID tiket tidak ditemukan.')
    }

    const result = await ticketService.updateStatus(
      idToUpdate,
      statusPayload
    )

    successMessage.value =
      'Status tiket berhasil diperbarui ke ' +
      (result?.display_status || statusPayload)

    emit('confirmed', {
      ticketId: props.ticketId,
      decision: selectedDecision.value,
      newStatus: statusPayload,
      data: result
    })

    setTimeout(() => {
      emit('close')
    }, 600)

  } catch (err) {
    console.error('Error submitting triage decision:', err)

    errorMessage.value =
      err.message || 'Transisi status tidak valid.'

  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
    
    <!-- Modal Card Box matching Triage.png -->
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border-2 border-[#54b8ea] text-slate-900 font-sans">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Pulse wave icon box -->
          <div class="w-9 h-9 rounded-xl bg-[#004d7a] flex items-center justify-center text-white shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-extrabold text-slate-950">
              Triage & Predictive Analysis - {{ triageData.ticket_id }}
            </h2>
            <p class="text-xs text-slate-600 mt-0.5">
              Risk Score: {{ triageData.risk_score }} | Pelapor: {{ triageData.pelapor }}
            </p>
          </div>
        </div>

        <!-- Close X Icon Button -->
        <button 
          @click="$emit('close')" 
          class="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body 3-column / 2-row layout -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
        
        <!-- COLUMN 1 (Left): Laporan Crowdsourcing & Clustering Visualisasi (Span 4) -->
        <div class="md:col-span-4 space-y-4 flex flex-col">
          
          <!-- Laporan Crowdsourcing -->
          <div>
            <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Laporan Crowdsourcing</span>
            </div>

            <div class="border border-slate-700 rounded-xl p-3 bg-white flex gap-3">
              <!-- Water faucet / water image -->
              <div class="w-20 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-300">
                <img :src="triageData.photo_url" alt="Laporan warga" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 flex flex-col justify-between text-xs">
                <p class="font-bold text-slate-900 leading-snug">
                  "{{ triageData.keluhan }}"
                </p>
                <div class="text-[10px] text-slate-500 mt-2">
                  <div class="font-semibold text-slate-700 uppercase">Lokasi</div>
                  <div class="truncate">{{ triageData.lokasi }}</div>
                  <div class="text-right text-slate-400 mt-1">{{ triageData.waktu }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clustering Visualisasi -->
          <div class="flex-1 flex flex-col">
            <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Clustering Visualisasi</span>
            </div>

            <!-- Visual diagram box -->
            <div class="border border-slate-700 rounded-xl p-4 bg-white flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
              <svg class="w-full h-28" viewBox="0 0 240 120">
                <!-- Cluster connected lines -->
                <line x1="50" y1="50" x2="120" y2="65" stroke="#92400e" stroke-width="1.5" stroke-dasharray="3,3" />
                <line x1="70" y1="100" x2="120" y2="65" stroke="#92400e" stroke-width="1.5" stroke-dasharray="3,3" />
                <line x1="190" y1="50" x2="120" y2="65" stroke="#92400e" stroke-width="1.5" stroke-dasharray="3,3" />

                <!-- Nodes -->
                <circle cx="50" cy="50" r="6" fill="#854d0e" />
                <circle cx="70" cy="100" r="5" fill="#854d0e" />
                <circle cx="190" cy="50" r="5" fill="#854d0e" />

                <!-- Center node: Valve Pipa -->
                <circle cx="120" cy="65" r="9" fill="#854d0e" />
              </svg>
              
              <div class="mt-1 px-3 py-1 bg-white border border-slate-700 rounded text-[11px] font-bold text-slate-800">
                Valve Pipa Sekunder C-05
              </div>
            </div>
          </div>

        </div>

        <!-- COLUMN 2 (Center): Sensor IoT Terdekat & Aksi & Eksekusi (Span 4) -->
        <div class="md:col-span-4 space-y-4 flex flex-col">
          
          <!-- Sensor IoT Terdekat -->
          <div>
            <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="3" stroke-width="2" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span>Sensor IoT Terdekat: {{ triageData.iot_nearest.node_id }}</span>
            </div>

            <div class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div class="border border-slate-700 rounded-xl p-2.5 bg-white">
                  <div class="text-[9px] font-bold text-slate-500 uppercase">Kekeruhan (Turbidity)</div>
                  <div class="text-xs font-extrabold text-slate-900 mt-1">{{ triageData.iot_nearest.turbidity }}</div>
                </div>
                <div class="border border-slate-700 rounded-xl p-2.5 bg-white">
                  <div class="text-[9px] font-bold text-slate-500 uppercase">Tekanan Pipa</div>
                  <div class="text-xs font-extrabold text-slate-900 mt-1">
                    {{
                      triageData.iot_nearest.pressure === '-'
                        ? '-'
                        : `${triageData.iot_nearest.pressure} ${triageData.iot_nearest.pressure_unit}`
                    }}
                  </div>
                </div>
              </div>

              <div class="border border-slate-700 rounded-xl p-2.5 bg-white">
                <div class="text-[9px] font-bold text-slate-500 uppercase">Status Sensor</div>
                <div class="text-xs font-bold text-rose-600 mt-0.5">{{ triageData.iot_nearest.status }}</div>
              </div>
            </div>
          </div>

          <!-- Aksi & Eksekusi -->
          <div class="flex-1 flex flex-col">
            <div class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Aksi & Eksekusi
            </div>

            <div class="space-y-3 flex-1">
              <!-- Button Confirm (Valid) -->
              <button 
                @click="handleSelect('valid')"
                :disabled="confirming"
                class="w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 disabled:opacity-60"
                :class="selectedDecision === 'valid'
                  ? 'border-amber-700 bg-[#fffbeb] shadow-sm'
                  : 'border-amber-700/60 bg-[#fffdf5] hover:bg-[#fffbeb]'"
              >
                <div class="w-5 h-5 rounded border border-slate-700 flex items-center justify-center shrink-0 mt-0.5" :class="selectedDecision === 'valid' ? 'bg-amber-600 text-white' : 'bg-white'">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900">Validasi Laporan (Proses Triage)</div>
                  <div class="text-[11px] text-slate-500">
                    {{ props.ticket?.status === 'SUBMITTED' ? 'Verifikasi laporan masuk & ubah ke Sedang Ditinjau (IN_REVIEW).' : 'Konfirmasi validitas data laporan.' }}
                  </div>
                </div>
              </button>

              <!-- Button Abaikan (False Positive) -->
              <button 
                @click="handleSelect('false_positive')"
                :disabled="confirming"
                class="w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 disabled:opacity-60"
                :class="selectedDecision === 'false_positive'
                  ? 'border-slate-800 bg-[#e0f2fe] shadow-sm'
                  : 'border-slate-700/60 bg-[#f0f9ff] hover:bg-[#e0f2fe]'"
              >
                <div class="w-5 h-5 rounded border border-slate-700 flex items-center justify-center shrink-0 mt-0.5" :class="selectedDecision === 'false_positive' ? 'bg-sky-600 text-white' : 'bg-white'">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900">Abaikan (Tinjau Selanjutnya)</div>
                  <div class="text-[11px] text-slate-500">Lanjutkan peninjauan internal (IN_REVIEW).</div>
                </div>
              </button>

              <!-- Decision Confirmation Box (Shows up when user clicks one of the buttons) -->
              <div 
                v-if="selectedDecision"
                class="border border-slate-700 rounded-xl p-3.5 bg-white text-center space-y-3 mt-2 shadow-sm"
              >
                <!-- Error Alert Banner -->
                <div 
                  v-if="errorMessage" 
                  class="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px] text-left flex items-start gap-1.5"
                >
                  <svg class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="9" stroke-width="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{{ errorMessage }}</span>
                </div>

                <!-- Success Alert Banner -->
                <div 
                  v-if="successMessage" 
                  class="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-[11px] text-left flex items-start gap-1.5"
                >
                  <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ successMessage }}</span>
                </div>

                <div class="text-xs text-slate-800">
                  Anda memilih 
                  <span class="font-bold text-slate-950">
                    {{ selectedDecision === 'valid' ? 'Validasi Laporan' : 'Abaikan (Tinjau)' }}
                  </span>
                  <div class="text-[10px] text-slate-500 mt-0.5">
                    Transisi status: <span class="font-semibold text-slate-700">{{ props.ticket?.status || 'SUBMITTED' }} → {{ (props.ticket?.status === 'SUBMITTED' || !props.ticket?.status) ? 'IN_REVIEW' : getNextStatusForTicket() }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="cancelSelection"
                    :disabled="confirming"
                    class="flex-1 py-2 px-3 rounded-lg bg-[#853006] text-white text-xs font-semibold hover:bg-[#702604] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    @click="submitDecision"
                    :disabled="confirming"
                    class="flex-1 py-2 px-3 rounded-lg bg-[#38bdf8] text-slate-950 text-xs font-bold hover:bg-[#0284c7] hover:text-white transition-colors disabled:opacity-50"
                  >
                    {{ confirming ? 'Menyimpan...' : 'Confirm' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- COLUMN 3 (Right): Audit Trail & History + Rekomendasi Tindakan (Span 4) -->
        <div class="md:col-span-4 space-y-4 flex flex-col">
          
          <!-- Audit Trail & History -->
          <div class="flex-1">
            <div class="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Audit Trail & History</span>
            </div>

            <div class="border border-slate-700 rounded-xl p-4 bg-white space-y-3 relative">
              <!-- Timeline vertical line -->
              <div class="absolute left-7 top-7 bottom-7 w-0.5 bg-slate-900"></div>

              <!-- Item 1 -->
              <div class="relative flex items-start gap-4 z-10">
                <div class="w-3.5 h-3.5 rounded-full bg-slate-900 mt-4 shrink-0"></div>
                <div class="flex-1 border border-slate-700 rounded-lg p-2.5 bg-white text-xs">
                  <div class="text-[10px] text-slate-500 font-medium">05:10 • SYSTEM (IOT)</div>
                  <div class="font-bold text-slate-900 mt-1 leading-snug">
                    Turbidity anomali terdeteksi di Node T-Tengah_05. Risk: Critical
                  </div>
                </div>
              </div>

              <!-- Item 2 -->
              <div class="relative flex items-start gap-4 z-10">
                <div class="w-3.5 h-3.5 rounded-full bg-slate-900 mt-4 shrink-0"></div>
                <div class="flex-1 border border-slate-700 rounded-lg p-2.5 bg-white text-xs">
                  <div class="text-[10px] text-slate-500 font-medium">05:18 • SYSTEM (APP)</div>
                  <div class="font-bold text-slate-900 mt-1 leading-snug">
                    Menerima laporan warga (Pak Budi dkk). K-Means clustering teraktivasi.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rekomendasi Tindakan -->
          <div>
            <div class="border border-slate-700 rounded-xl p-3.5 bg-white space-y-1.5">
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Rekomendasi Tindakan</span>
              </div>
              <p class="text-[11px] text-slate-700 leading-relaxed">
                {{ triageData.rekomendasi }}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>
