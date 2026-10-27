<!--
  App.vue — Application root.
  Renders the active route component via <RouterView />.
  Layout (UserLayout / AdminLayout) is applied at the route level.
-->
<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>
