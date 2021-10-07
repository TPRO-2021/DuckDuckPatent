<template>
    <div>
        <input id="search" placeholder="Enter keywords" />
        <button type="button" id="search-btn"><span class="material-icons search-icon">search</span></button>
    </div>
</template>

<script>
import { Vue, Options } from 'vue-class-component';

@Options({})
export default class Searchbar extends Vue {}
</script>

<style scoped>
#search {
    float: left;
    width: 592px;
    height: 45px;
    border: 1px solid grey;
    border-radius: 25px;
    padding-inline-start: 25px;
}

/* Style the submit button */
#search-btn {
    float: right;
    width: 10%;
    height: 47px;
    padding: 10px;
    background: black;
    color: white;
    border-left-color: grey;
    border-left-style: solid;
    border-left-width: 1px;
    border-left: none;
    cursor: pointer;
    border-bottom-right-radius: 25px;
    border-top-right-radius: 25px;
    margin-top: -48px;
    margin-left: -62px;
}

search-icon {
    font-size: 30px !important;
}

/*#search-btn:hover {*/
/*    background: #0b7dda;*/
/*}*/
</style>
