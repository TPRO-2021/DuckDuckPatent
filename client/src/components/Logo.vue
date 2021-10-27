<template>
    <div><img src="../assets/logo.svg" class="logo" alt="Logo of DuckDuckPatent" /></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Logo',
});
</script>

<style scoped>
.logo {
    position: relative;
    top: -50px;
    height: 110px;
}
</style>
