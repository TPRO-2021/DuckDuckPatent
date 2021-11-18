<template>
    <!-- Loading indicator -->
    <div class="progress-bar">
        <ProgressBar mode="indeterminate" v-if="showLoadingBar"></ProgressBar>
    </div>

    <!-- Loading screen -->
    <LoadingScreen></LoadingScreen>

    <!-- Dialog Mask -->
    <DialogMask></DialogMask>

    <!-- Notification toast -->
    <Toasts />

    <!-- Router outlet -->
    <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import Toasts from '@/components/Toasts.vue';
import DialogMask from '@/components/DialogMask.vue';

/**
 * App component which is used to add the router-outlet as well as general components to the app
 */
export default defineComponent({
    name: 'App',
    components: { LoadingScreen, Toasts, DialogMask },
    beforeCreate() {
        this.$store.dispatch('loadSavedState');
    },
    computed: {
        /**
         * Returns true if the loading bar should be shown
         */
        showLoadingBar(): boolean {
            return this.$store.state.showLoadingBar;
        },
    },
});
</script>

<style lang="scss">
// importing global stylesheet
@import '~@/styles/global.scss';

#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

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
