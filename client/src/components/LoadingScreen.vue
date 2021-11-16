<template>
    <div class="loading-screen" v-if="showLoadingScreen">
        <img src="../assets/graph.svg" alt="Loading indicator" />
        <p class="sub-heading">Loading <span class="sub-heading-dots">...</span></p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * This component contains the loading screen which can be shown by setting the
 * state variable 'showLoadingScreen' to true
 */
export default defineComponent({
    name: 'LoadingScreen',
    computed: {
        /**
         * Exposes the state variable showLoadingScreen
         */
        showLoadingScreen(): boolean {
            return this.$store.state.showLoadingScreen;
        },
    },
});
</script>

<style scoped lang="scss">
.loading-screen {
    animation: fadeIn 0.1s ease;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: white;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10000;

    display: flex;
    align-items: center;
    justify-content: center;

    img {
        height: 600px;
        transform: translateX(-15px);
    }
}

.sub-heading {
    color: black;
    position: absolute;
    bottom: 40px;
    transform: translateX(-100%);

    animation: pulsate 1.5s ease-out;
    animation-iteration-count: infinite;
}

@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

@keyframes pulsate {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

@media screen and (max-width: 650px) {
    .loading-screen {
        img {
            width: 400px;
        }
    }
}
</style>
