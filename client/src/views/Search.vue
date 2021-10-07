<template>
    <div class="container logo-container">
        <Logo class="logo" />
    </div>
    <div class="container">
        <Searchbar id="search-bar" />
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Button from '@/components/Button.vue';
import Searchbar from '@/components/Searchbar.vue';
import Logo from '@/components/Logo.vue';

@Options({
    components: {
        Button,
        Searchbar,
        Logo,
    },
})
export default class Search extends Vue {
    triggerSearch(): void {
        console.log('test');
    }
}
</script>

<style lang="scss" scoped>
.container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.logo-container {
    pointer-events: none;
    position: absolute;

    .logo {
        padding-bottom: 150px;
    }
}

#search-bar {
    padding: 20px 0;
}
</style>
