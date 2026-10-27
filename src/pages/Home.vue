<!--
  TEMPORARY DEVELOPMENT INDEX PAGE
  This page exists only for layout & routing verification.
  It is NOT a final product page and will be replaced.
-->
<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
    <div class="bg-white shadow rounded-lg p-8 max-w-sm w-full text-center space-y-4">
      <h1 class="text-lg font-bold text-gray-700">AQUA-TARA — Dev Index</h1>
      <p class="text-xs text-red-500 italic">
        TEMPORARY DEVELOPMENT PAGE — Not a final product page.
      </p>
      <div class="pt-2 space-y-2">
        <RouterLink
          to="/dev-user"
          class="block w-full text-sm py-2 px-4 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          → User Layout (dev-user)
        </RouterLink>
        <RouterLink
          to="/dev-admin"
          class="block w-full text-sm py-2 px-4 rounded bg-green-100 text-green-700 hover:bg-green-200"
        >
          → Admin Layout (dev-admin)
        </RouterLink>
      </div>
      <p class="text-xs text-gray-400 pt-2">
        Routes are temporary. Final paths = TBD.
      </p>
    </div>
  </div>
</template>
