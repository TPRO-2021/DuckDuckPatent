<template>
    <router-view />
</template>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}

/* You can add global styles to this file, and also import other style files */

// removes default padding
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

// removes default border from button
button {
    border: none;
}
</style>
