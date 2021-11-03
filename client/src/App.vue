<template>
    <div class="progress-bar">
        <ProgressBar mode="indeterminate" v-if="showLoadingBar"></ProgressBar>
    </div>
    <LoadingScreen></LoadingScreen>
    <Toasts />
    <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Toasts from '@/components/Toasts.vue';

export default defineComponent({
    name: 'App',
    components: { LoadingScreen, Toasts },
    beforeCreate() {
        this.$store.dispatch('loadSavedState');
    },
    computed: {
        showLoadingBar(): boolean {
            return this.$store.state.showLoadingBar;
        },
    },
});
</script>

<style lang="scss">
@import '~@/styles/global.scss';

#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

/* You can add global styles to this file, and also import other style files */

// removes default border from button
button {
    border: none;
}

.progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
}
</style>
