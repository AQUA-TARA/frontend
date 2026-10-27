<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getPublicMap } from '@/api/client.js'
import { userSidebarOpen } from '@/stores/sidebarStore.js'

const mapMarkers = ref([])
const isLoadingMap = ref(false)
const mapError = ref('')
const isLegendOpen = ref(false)

const toggleLegend = () => {
  isLegendOpen.value = !isLegendOpen.value
}

const fetchMapData = async () => {
  isLoadingMap.value = true
  mapError.value = ''
  try {
    const result = await getPublicMap()
    if (result.success && result.data?.markers) {
      mapMarkers.value = result.data.markers
    }
  } catch (e) {
    // Graceful fallback
  } finally {
    isLoadingMap.value = false
    renderMarkers()
  }
}

const mapContainer = ref(null)
let mapInstance = null
let markersGroup = null

const initMap = () => {
  if (!mapContainer.value) return

  // Center coordinate around Tarakan City center
  mapInstance = L.map(mapContainer.value, {
    center: [3.315, 117.592],
    zoom: 14,
    zoomControl: false,
    attributionControl: false
  })

  // Satellite tile layer with fallback/custom styling matching reference
  // Light mode OpenStreetMap tiles matching admin map
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  osmLayer.addTo(mapInstance)

  markersGroup = L.layerGroup().addTo(mapInstance)
  renderMarkers()
}

const createGlowIcon = (color, hasPulse = false) => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="user-map-node ${hasPulse ? 'has-pulse' : ''}" style="--node-color: ${color};">
        <div class="node-glow" style="background: ${color};"></div>
        <div class="node-ring" style="border-color: #ffffff; background: ${color};"></div>
        ${hasPulse ? '<div class="node-radar" style="background: ' + color + ';"></div>' : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  })
}

const renderMarkers = () => {
  if (!markersGroup) return
  markersGroup.clearLayers()

  // Defined positions matching the visual reference (Maps Area.png)
  // Render markers from fetched public map data
  if (!Array.isArray(mapMarkers.value)) return
  mapMarkers.value.forEach(item => {
    // Determine color based on level (risk)
    let color = '#38bdf8' // default Aman (green/blue)
    if (item.level === 'WASPADA') color = '#eab308' // Yellow
    else if (item.level === 'BAHAYA') color = '#ef4444' // Red
    const marker = L.marker([item.lat, item.lng], {
      icon: createGlowIcon(color, false)
    })
    markersGroup.addLayer(marker)
  })
}

const handleRefresh = async () => {
  isLoadingMap.value = true
  await fetchMapData()
  setTimeout(() => {
    isLoadingMap.value = false
  }, 400)
}

onMounted(async () => {
  initMap()
  await fetchMapData()
})

watch(userSidebarOpen, () => {
  if (mapInstance) {
    nextTick(() => {
      mapInstance.invalidateSize()
    })
  }
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#0d161d] select-none font-sans">
    <!-- 1. Floating Top Glassmorphism Card (Exact replica of Maps Area.png) -->
    <div class="absolute top-4 inset-x-4 z-[1000] pointer-events-auto">
      <div class="relative overflow-hidden rounded-[22px] border border-white/60 bg-black/40 backdrop-blur-md p-4 shadow-2xl">
        <!-- Header row: Title & Refresh button -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-[17px] font-bold text-white tracking-wide">Peta Kualitas Air</h1>
            <p class="text-[11px] text-white/80 mt-0.5">Transparansi Distribusi & Kekeruhan Kota Tarakan</p>
          </div>
          <button
            type="button"
            @click="handleRefresh"
            class="w-8 h-8 rounded-lg border border-white/60 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 active:scale-95 transition"
            title="Segarkan Peta"
          >
            <svg
              class="w-4 h-4 text-white"
              :class="{ 'animate-spin': isLoadingMap }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- Inner Location Box -->
        <div class="relative mt-3.5 rounded-[16px] border border-white/50 bg-black/25 px-4 py-2.5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p class="text-[10px] text-white/70">Wilayah Anda</p>
              <h2 class="text-sm font-bold text-white tracking-wide">Karang Anyar</h2>
            </div>
          </div>
          <!-- Glowing cyan beacon indicator dot in corner -->
          <div class="w-4 h-4 rounded-full bg-[#38bdf8] shadow-[0_0_12px_#38bdf8] border-2 border-white flex-shrink-0"></div>
        </div>
      </div>
    </div>

    <!-- 2. Leaflet Map Container with Satellite Background fallback -->
    <div
      ref="mapContainer"
      class="w-full h-full z-0 outline-none"
    ></div>

    <!-- 3. Bottom Collapsible Legend (Exact replica of Maps Area (Legenda).png) -->
    <div class="absolute bottom-4 inset-x-4 z-[1000] pointer-events-auto">
      <div class="rounded-[22px] border border-[#38bdf8]/50 bg-black/60 backdrop-blur-md p-3.5 shadow-2xl transition-all duration-300">
        <!-- Legend rows when open -->
        <div v-if="isLegendOpen" class="space-y-2 mb-3">
          <!-- Kritis -->
          <div class="rounded-xl border border-[#ea580c] bg-black/40 px-3.5 py-2 flex items-center space-x-3">
            <div class="w-3.5 h-3.5 rounded-full bg-[#ea580c] shadow-[0_0_8px_#ea580c]"></div>
            <span class="text-xs text-white font-normal">Kritis - Risiko Tinggi Kontaminasi Pipa</span>
          </div>

          <!-- Warning -->
          <div class="rounded-xl border border-[#eab308] bg-black/40 px-3.5 py-2 flex items-center space-x-3">
            <div class="w-3.5 h-3.5 rounded-full bg-[#eab308] shadow-[0_0_8px_#eab308]"></div>
            <span class="text-xs text-white font-normal">Warning - Potensi Kekeruhan Air</span>
          </div>

          <!-- Aman -->
          <div class="rounded-xl border border-[#38bdf8] bg-black/40 px-3.5 py-2 flex items-center space-x-3">
            <div class="w-3.5 h-3.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]"></div>
            <span class="text-xs text-white font-normal">Aman - Air Jernih & Layak Konsumsi</span>
          </div>
        </div>

        <!-- Legend toggle bar -->
        <button
          type="button"
          @click="toggleLegend"
          class="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div class="flex items-center space-x-2.5">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs font-medium text-white">Keterangan Peta</span>
          </div>
          <svg
            class="w-4 h-4 text-white transition-transform duration-200"
            :class="{ 'rotate-180': !isLegendOpen }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.user-sat-map {
  background-color: #0c151c;
  background-image: url('/assets/tarakan_satellite.jpg');
  background-size: cover;
  background-position: center;
}

.user-map-node {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-glow {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  opacity: 0.45;
  filter: blur(6px);
}

.node-ring {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px var(--node-color);
  z-index: 2;
}

.node-radar {
  position: absolute;
  width: 36px;
  height: 36px;
  clip-path: polygon(50% 50%, 100% 0, 100% 100%);
  opacity: 0.35;
  transform-origin: 50% 50%;
  animation: sweep 4s linear infinite;
  z-index: 1;
}

@keyframes sweep {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
