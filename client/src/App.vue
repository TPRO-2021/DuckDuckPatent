<template>
    <router-view />
</template>

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
</style>
