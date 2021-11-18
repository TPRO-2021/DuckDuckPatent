<template>
    <div><img src="../assets/logo.svg" class="logo" alt="Logo of DuckDuckPatent" /></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Component which contains DuckDuckPatent's logo
 */
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

@media screen and (max-width: 650px) {
    .logo {
        height: 90px;
    }
}
</style>
