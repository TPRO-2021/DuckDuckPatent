<template>
    <div>
        <label for="search"><h1>{{ title }}</h1></label>
        <input v-model="keyword" id="search" placeholder="Enter keywords">
        <FilterIcon />
    </div>
</template>

<script>
import FilterIcon from "./filters/filter.vue";

    export default {
        name: "SearchBar",
        data() {
            return {
                keyword: '',
                title: 'duckduckpatent'
            }
        },
        components: {
            FilterIcon
        }
    }
</script>

<style scoped>

#search {
    position: absolute;
    width: 592px;
    height: 45px;
    left: 35%;
    top: 40%;
    border: 1px solid grey;
    border-radius: 25px;
    padding-inline-start: 25px;
}

label {
    position: absolute;
    left: 43%;
    top: 30%;
}
</style>