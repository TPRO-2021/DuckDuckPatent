<template>
    <div class="list-target">
        <div class="list-picker">
            <div v-for="item in $props.list" :key="item.key">
                <input
                    :id="item.key"
                    :checked="selected.includes(item.key)"
                    @change="onSelected(item.key, item.value)"
                    type="checkbox"
                />
                <label :for="item.key">{{ item.value }}</label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'ListPicker',
    props: {
        selected: {
            type: Array,
            default: () => [],
        },
        list: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {};
    },
    emits: ['select'],
    methods: {
        /**
         *  @function emits an event to pick an item from the list
         */
        onSelected(key: string, value: string): void {
            this.$emit('select', { key, value }); // Emit select
        },
    },
});
</script>

<style lang="scss" scoped>
.list-target {
    display: block;
    height: 1em;
    max-width: 150px;
}
.list-picker {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    background-color: white;
    padding: 5px;
    box-shadow: 0px 0px 10px grey;
    box-sizing: border-box;
    padding: 10px 5px;
    max-height: 300px;
    overflow-y: auto;
    position: relative;
    z-index: 2000;
}
.list-picker > * {
    display: flex;
    flex-direction: row;
}
.list-picker > * > * {
    margin: 5px;
}
.list-picker > * > label {
    text-align: left;
}
.list-picker > * > input {
    border-radius: 5px;
    background: lightgrey;
    border: none;
    padding: 0px 5px;
}
</style>
