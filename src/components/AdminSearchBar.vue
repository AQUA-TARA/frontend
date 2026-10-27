<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ticketService } from '@/services/ticketService';

const router = useRouter();
const query = ref('');

const search = async () => {
  const q = query.value.trim();
  router.push({ path: '/admin/report', query: q ? { q } : {} });
};
</script>

<template>
  <div class="relative flex-1 mr-4">
    <svg xmlns="http://www.w3.org/2000/svg"
         class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-700"
         fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
    <input v-model="query"
           @keyup.enter="search"
           type="text"
           placeholder="Lacak Status Laporan (Masukkan ID Tiket)"
           class="w-full pl-10 pr-4 py-2 bg-transparent border border-slate-700 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-700 transition-colors" />
  </div>
</template>
