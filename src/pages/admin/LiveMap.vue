<template>
  <div class="live-map-page p-6 md:p-8 max-w-[1440px] w-full mx-auto flex-1 flex flex-col font-sans">

    <!-- Map Card Container -->
    <div
      class="map-card-wrapper relative rounded-2xl overflow-hidden shadow-2xl flex-1 min-h-[620px] border-2 border-[#54b8ea] bg-slate-100 isolate"
      ref="mapWrapperEl"
    >

      <!-- Leaflet Map Container -->
      <div id="admin-leaflet-map" class="w-full h-full min-h-[620px] z-10"></div>

      <!-- Floating Title Panel (Top-Left) -->
      <div class="absolute top-5 left-5 z-20 bg-white/95 backdrop-blur-md border border-slate-700/60 rounded-xl px-5 py-3 text-slate-900 max-w-sm shadow-xl">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 class="text-sm font-bold text-slate-950 tracking-wide">Live Map Monitoring</h2>
        </div>
        <p class="text-[11px] text-slate-600 mt-1 leading-snug">
          Heatmap Sensor Kekeruhan Air (IoT) & Titik Laporan Warga
        </p>
        <div v-if="mapSummary" class="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
          <span>Sensor Terbaca: <b>{{ mapSummary.total_sensor_points ?? 0 }}</b></span>
          <span v-if="mapSummary.max_turbidity !== null">Maks: <b>{{ mapSummary.max_turbidity }} NTU</b></span>
        </div>
      </div>

      <!-- Loading / Error Overlay -->
      <div v-if="isLoading" class="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
        <div class="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xl text-xs font-semibold text-slate-800">
          <svg class="animate-spin w-4 h-4 text-[#004d7a]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Memuat data spasial sensor...</span>
        </div>
      </div>

      <div v-else-if="errorMessage" class="absolute top-20 left-5 z-20 bg-rose-50 border border-rose-300 rounded-xl px-4 py-2.5 text-xs text-rose-800 shadow-lg flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ errorMessage }}</span>
        <button @click="loadMapData" class="underline font-bold ml-2">Coba Lagi</button>
      </div>

      <!-- Floating Tool Controls (Top-Right): Filter, Recenter, Fullscreen -->
      <div class="absolute top-5 right-5 z-20 flex flex-col gap-3">
        <!-- Filter Toggle Button -->
        <div class="relative">
          <button
            @click="showFilterMenu = !showFilterMenu"
            class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors shadow-xl"
            aria-label="Filter Layers"
            title="Pengaturan Layer Peta"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>

          <!-- Layer Control Dropdown -->
          <div v-if="showFilterMenu" class="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3.5 shadow-2xl z-30 text-xs text-slate-800 space-y-2.5">
            <div class="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex justify-between items-center">
              <span>Layer Peta</span>
              <button @click="showFilterMenu = false" class="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="layerOptions.showHeatmap" @change="toggleLayers" class="rounded text-[#004d7a]">
              <span>Heatmap Sensor Turbidity</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="layerOptions.showSensors" @change="toggleLayers" class="rounded text-[#004d7a]">
              <span>Pin Node Sensor IoT</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="layerOptions.showReports" @change="toggleLayers" class="rounded text-[#004d7a]">
              <span>Titik Laporan Warga</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="layerOptions.showPipes" @change="toggleLayers" class="rounded text-[#004d7a]">
              <span>Jaringan Pipa PDAM</span>
            </label>

            <div class="pt-2 border-t border-slate-200">
              <span class="text-[11px] font-semibold text-slate-600 block mb-1">Mode Heatmap:</span>
              <select v-model="filterMode" @change="loadMapData" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800">
                <option value="latest">Terkini (1 per node)</option>
                <option value="history">Histori 24 Jam</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Compass / Recenter Button -->
        <button
          @click="recenterMap"
          class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors shadow-xl"
          aria-label="Recenter"
          title="Pusatkan Peta"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <!-- Fullscreen Button -->
        <button
          @click="toggleFullscreen"
          class="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-slate-700/60 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors shadow-xl"
          aria-label="Fullscreen"
          title="Layar Penuh"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      <!-- Floating Legend (Bottom-Right) -->
      <div class="absolute bottom-5 right-5 z-20 bg-white/95 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 text-slate-900 w-80 shadow-2xl">
        <h3 class="text-xs font-bold text-slate-900 mb-2 pb-1.5 border-b border-slate-200">
          Keterangan Heatmap & Sensor
        </h3>

        <div class="space-y-2 text-[11px] text-slate-700">
          <!-- Sensor Indicators -->
          <div class="font-semibold text-[10px] text-slate-500 uppercase tracking-wider mt-1">Heatmap Kekeruhan Air (NTU)</div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#0284c7]"></span>
              <span>Jernih (&le; 5 NTU)</span>
            </div>
            <span class="text-[10px] text-slate-500">Aman</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
              <span>Waspada (5 - 25 NTU)</span>
            </div>
            <span class="text-[10px] text-slate-500">Keruh Sedang</span>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-[#ef4444]"></span>
              <span>Bahaya (&gt; 25 NTU)</span>
            </div>
            <span class="text-[10px] text-slate-500">Sangat Keruh</span>
          </div>

          <!-- Separator for Citizen Reports -->
          <div class="font-semibold text-[10px] text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-200">
            Layer Laporan Warga
          </div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-violet-600 border border-white"></span>
            <span>Titik Keluhan Laporan (Warga)</span>
          </div>
        </div>

        <!-- Source Footer -->
        <div class="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
          <span class="text-slate-500 font-medium">Sumber Heatmap</span>
          <span class="font-bold text-[#0284c7]">Data Sensor IoT Murni</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchAdminMap } from '@/api/client'

// Demo tickets data aligned with Dashboard urgent_tickets
const demoData = {
  // Heatmap points based on turbidity (using same values as demo tickets)
  heatmap: [
    { latitude: 3.3274, longitude: 117.5878, category: 'JERNIH', intensity: 0.95, hardware_id: 'AQT-CLUSTER-005', turbidity: 95, measured_at: new Date().toISOString() },
    { latitude: 3.3270, longitude: 117.5900, category: 'WASPADA', intensity: 0.85, hardware_id: 'AQT-CLUSTER-001', turbidity: 85, measured_at: new Date().toISOString() },
    { latitude: 3.3330, longitude: 117.5905, category: 'WASPADA', intensity: 0.90, hardware_id: 'AQT-261018-0001', turbidity: 90, measured_at: new Date().toISOString() },
    { latitude: 3.3265, longitude: 117.5855, category: 'JERNIH', intensity: 0.81, hardware_id: 'AQT-CLUSTER-007', turbidity: 81, measured_at: new Date().toISOString() },
    { latitude: 3.3220, longitude: 117.5810, category: 'JERNIH', intensity: 0.71, hardware_id: 'AQT-CLUSTER-003', turbidity: 71, measured_at: new Date().toISOString() },
    { latitude: 3.3280, longitude: 117.5920, category: 'WASPADA', intensity: 0.76, hardware_id: 'AQT-CLUSTER-004', turbidity: 76, measured_at: new Date().toISOString() },
    { latitude: 3.3272, longitude: 117.5885, category: 'WASPADA', intensity: 0.78, hardware_id: 'AQT-261019-0001', turbidity: 78, measured_at: new Date().toISOString() },
    { latitude: 3.3215, longitude: 117.5805, category: 'JERNIH', intensity: 0.73, hardware_id: 'AQT-261020-0001', turbidity: 73, measured_at: new Date().toISOString() },
    { latitude: 3.3340, longitude: 117.5910, category: 'WASPADA', intensity: 0.74, hardware_id: 'AQT-261021-0001', turbidity: 74, measured_at: new Date().toISOString() },
    { latitude: 3.3290, longitude: 117.5930, category: 'JERNIH', intensity: 0.72, hardware_id: 'AQT-261021-0002', turbidity: 72, measured_at: new Date().toISOString() }
  ],
  iot_nodes: [
    // Single demo IoT node (demo only)
    { latitude: 3.3274, longitude: 117.5900, hardware_id: 'Demo-Node-1', status: 'OPTIMAL', turbidity: 3, pressure: 1.0, is_active: true }
  ],
  reports: [
    { latitude: 3.3274, longitude: 117.5878, ticket_id: 'AQT-CLUSTER-005', description: 'Laporan demo – Zona Tarakan Tengah (Jl. Sudirman)', risk_score: 95, risk_level: 'Bahaya', status: 'SUBMITTED' },
    { latitude: 3.3270, longitude: 117.5900, ticket_id: 'AQT-CLUSTER-001', description: 'Laporan demo – Zona Tarakan Timur (Perum. Juata)', risk_score: 94, risk_level: 'Bahaya', status: 'SUBMITTED' },
    { latitude: 3.3330, longitude: 117.5905, ticket_id: 'AQT-261018-0001', description: 'Laporan demo – Zona Tarakan Utara (Kp. Bugis)', risk_score: 91, risk_level: 'Bahaya', status: 'SUBMITTED' },
    { latitude: 3.3265, longitude: 117.5855, ticket_id: 'AQT-CLUSTER-007', description: 'Laporan demo – Zona Tarakan Timur (Mamburungan)', risk_score: 89, risk_level: 'Waspada', status: 'IN_PROGRESS' },
    { latitude: 3.3220, longitude: 117.5810, ticket_id: 'AQT-CLUSTER-003', description: 'Laporan demo – Zona Tarakan Barat (Karang Anyar)', risk_score: 88, risk_level: 'Waspada', status: 'IN_PROGRESS' },
    { latitude: 3.3280, longitude: 117.5920, ticket_id: 'AQT-CLUSTER-004', description: 'Laporan demo – Zona Tarakan Timur (Pamusian)', risk_score: 85, risk_level: 'Waspada', status: 'CONFIRMED' },
    { latitude: 3.3272, longitude: 117.5885, ticket_id: 'AQT-261019-0001', description: 'Laporan demo – Zona Tarakan Tengah (Pasar Beringin)', risk_score: 82, risk_level: 'Waspada', status: 'IN_REVIEW' },
    { latitude: 3.3215, longitude: 117.5805, ticket_id: 'AQT-261020-0001', description: 'Laporan demo – Zona Tarakan Barat (Sebengkok)', risk_score: 79, risk_level: 'Waspada', status: 'SUBMITTED' },
    { latitude: 3.3340, longitude: 117.5910, ticket_id: 'AQT-261021-0001', description: 'Laporan demo – Zona Tarakan Utara (Juata Laut)', risk_score: 77, risk_level: 'Waspada', status: 'IN_REVIEW' },
    { latitude: 3.3290, longitude: 117.5930, ticket_id: 'AQT-261021-0002', description: 'Laporan demo – Zona Tarakan Timur (Lingkas Ujung)', risk_score: 75, risk_level: 'Jernih', status: 'SUBMITTED' }
  ],
  pipe_network: { type: 'FeatureCollection', features: [] },
  summary: { total_sensor_points: 10, max_turbidity: 95 }
};


const mapWrapperEl = ref(null)
const showFilterMenu = ref(false)
const isLoading = ref(false)
const errorMessage = ref(null)
const filterMode = ref('latest')
const mapSummary = ref(null)

const layerOptions = ref({
  showHeatmap: true,
  showSensors: true,
  showReports: true,
  showPipes: true,
})

let mapInstance = null
let heatmapGroup = null
let sensorsGroup = null
let reportsGroup = null
let pipesGroup = null

// Tarakan coordinates center: ~3.3274, 117.5878
const TARAKAN_CENTER = [3.3274, 117.5878]

const createPulsingIcon = (status) => {
  let colorClass = 'node-optimal'
  if (status === 'ANOMALY') colorClass = 'node-anomaly'
  if (status === 'CRITICAL') colorClass = 'node-critical'

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="leaflet-glow-marker ${colorClass}">
        <div class="ring animate-ping"></div>
        <div class="dot"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })
}

const createReportIcon = (riskLevel) => {
  let color = '#7c3aed' // Violet default
  if (riskLevel === 'Bahaya') color = '#b91c1c'
  else if (riskLevel === 'Waspada') color = '#d97706'
  else if (riskLevel === 'Jernih') color = '#059669'

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="width: 14px; height: 14px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  })
}

const initMap = () => {
  if (mapInstance) return

  mapInstance = L.map('admin-leaflet-map', {
    center: TARAKAN_CENTER,
    zoom: 13,
    zoomControl: false
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(mapInstance)

  L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance)

  heatmapGroup = L.layerGroup().addTo(mapInstance)
  sensorsGroup = L.layerGroup().addTo(mapInstance)
  reportsGroup = L.layerGroup().addTo(mapInstance)
  pipesGroup = L.layerGroup().addTo(mapInstance)
}

const loadMapData = async () => {
  try {
    isLoading.value = true
    errorMessage.value = null

    const res = await fetchAdminMap({ mode: filterMode.value, hours: 24 })
    if (!res || !res.success || !res.data) {
      throw new Error(res?.message || 'Format data peta tidak valid.')
    }

    // Merge real data with demo data without duplicating entries
    const merged = {
      heatmap: Array.isArray(res.data.heatmap) ? [...demoData.heatmap, ...res.data.heatmap] : demoData.heatmap,
      iot_nodes: Array.isArray(res.data.iot_nodes) ? [...demoData.iot_nodes, ...res.data.iot_nodes] : demoData.iot_nodes,
      reports: Array.isArray(res.data.reports) ? [...demoData.reports, ...res.data.reports] : demoData.reports,
      pipe_network: res.data.pipe_network || demoData.pipe_network,
      summary: res.data.summary || demoData.summary
    };

    renderLayers(merged)
    mapSummary.value = merged.summary || null
  } catch (err) {
    console.error('Error loading admin map:', err)
    // On error, keep showing demo data (already rendered) and show error message
    errorMessage.value = err.message || 'Gagal terhubung ke API peta admin.'
  } finally {
    isLoading.value = false
  }
}

const renderLayers = (data) => {
  if (!mapInstance) return

  // 1. Clear existing layers
  heatmapGroup.clearLayers()
  sensorsGroup.clearLayers()
  reportsGroup.clearLayers()
  pipesGroup.clearLayers()

  // 2. Render Heatmap Sensor (Murni dari iot_measurements + iot_nodes)
  if (layerOptions.value.showHeatmap && Array.isArray(data.heatmap)) {
    data.heatmap.forEach(pt => {
      // Warna heatmap berdasarkan category
      let fillColor = '#0284c7' // Jernih
      if (pt.category === 'WASPADA') fillColor = '#f59e0b'
      else if (pt.category === 'BAHAYA') fillColor = '#ef4444'

      // Radius proporsional intensitas
      const radius = 350 + (pt.intensity * 400)
      const fillOpacity = 0.25 + (pt.intensity * 0.40)

      const circle = L.circle([pt.latitude, pt.longitude], {
        color: fillColor,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
        weight: 1.5,
        radius: radius
      })

      circle.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900">Area Kekeruhan Sensor: ${pt.hardware_id}</div>
          <div class="text-slate-600 mt-1">Turbidity: <span class="font-semibold text-slate-900">${pt.turbidity} NTU</span></div>
          <div class="text-slate-600">Kategori: <span class="font-semibold">${pt.category}</span></div>
          <div class="text-slate-500 text-[10px] mt-0.5">Waktu: ${new Date(pt.measured_at).toLocaleString('id-ID')}</div>
        </div>
      `)
      heatmapGroup.addLayer(circle)
    })
  }

  // 3. Render IoT Node Pins
  if (layerOptions.value.showSensors && Array.isArray(data.iot_nodes)) {
    data.iot_nodes.forEach(node => {
      const marker = L.marker([node.latitude, node.longitude], {
        icon: createPulsingIcon(node.status)
      })

      marker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900">Node Sensor: ${node.hardware_id}</div>
          <div class="text-slate-600 mt-0.5">Turbidity: <span class="font-semibold text-slate-800">${node.turbidity !== null ? node.turbidity + ' NTU' : '-'}</span></div>
          <div class="text-slate-600">Pressure: <span class="font-semibold text-slate-800">${node.pressure !== null ? node.pressure + ' bar' : '-'}</span></div>
          <div class="text-[10px] text-slate-500 mt-1">Status: ${node.status} (${node.is_active ? 'Aktif' : 'Non-aktif'})</div>
        </div>
      `)
      sensorsGroup.addLayer(marker)
    })
  }

  // 4. Render Citizen Reports (Layer Terpisah)
  if (layerOptions.value.showReports && Array.isArray(data.reports)) {
    data.reports.forEach(r => {
      const marker = L.marker([r.latitude, r.longitude], {
        icon: createReportIcon(r.risk_level)
      })

      marker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-slate-900">Tiket Laporan: ${r.ticket_id}</div>
          <div class="text-slate-700 mt-0.5 line-clamp-2">${r.description || 'Tidak ada keterangan'}</div>
          <div class="text-slate-600 mt-1">Risk Score: <span class="font-semibold">${r.risk_score ?? '-'}</span> (${r.risk_level ?? 'Belum Dianalisis'})</div>
          <div class="text-[10px] text-slate-500 mt-0.5">Status: ${r.status}</div>
        </div>
      `)
      reportsGroup.addLayer(marker)
    })
  }

  // 5. Render Pipe Network (GeoJSON)
  if (layerOptions.value.showPipes && data.pipe_network && data.pipe_network.features?.length > 0) {
    const pipeLayer = L.geoJSON(data.pipe_network, {
      style: {
        color: '#0284c7',
        weight: 3,
        opacity: 0.75
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties?.pipe_id) {
          layer.bindPopup(`<div class="text-xs font-semibold p-1">Pipa: ${feature.properties.pipe_id}</div>`)
        }
      }
    })
    pipesGroup.addLayer(pipeLayer)
  }
}

const toggleLayers = () => {
  if (!mapInstance) return
  if (layerOptions.value.showHeatmap) mapInstance.addLayer(heatmapGroup)
  else mapInstance.removeLayer(heatmapGroup)

  if (layerOptions.value.showSensors) mapInstance.addLayer(sensorsGroup)
  else mapInstance.removeLayer(sensorsGroup)

  if (layerOptions.value.showReports) mapInstance.addLayer(reportsGroup)
  else mapInstance.removeLayer(reportsGroup)

  if (layerOptions.value.showPipes) mapInstance.addLayer(pipesGroup)
  else mapInstance.removeLayer(pipesGroup)
}

const toggleFullscreen = () => {
  if (!mapWrapperEl.value) return
  if (!document.fullscreenElement) {
    mapWrapperEl.value.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const recenterMap = () => {
  if (mapInstance) {
    mapInstance.setView(TARAKAN_CENTER, 13)
  }
}

onMounted(() => {
  initMap()
  // Render demo data immediately
  renderLayers(demoData)
  mapSummary.value = demoData.summary || null
  // Then fetch real data and merge
  loadMapData()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style>
/* Leaflet Custom Glowing Marker Styles */
.custom-leaflet-marker {
  background: transparent;
  border: none;
}
.leaflet-glow-marker {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.leaflet-glow-marker .dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.leaflet-glow-marker .ring {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  opacity: 0.6;
  z-index: 1;
}

/* Optimal - Cyan */
.node-optimal .dot {
  background: #0284c7;
  box-shadow: 0 0 10px #38bdf8;
}
.node-optimal .ring {
  background: #38bdf8;
}

/* Anomaly - Yellow/Amber */
.node-anomaly .dot {
  background: #d97706;
  box-shadow: 0 0 10px #f59e0b;
}
.node-anomaly .ring {
  background: #f59e0b;
}

/* Critical - Red */
.node-critical .dot {
  background: #dc2626;
  box-shadow: 0 0 12px #ef4444;
}
.node-critical .ring {
  background: #ef4444;
}
</style>
