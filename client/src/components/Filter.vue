<template>
    <div :class="{ filter: true, 'is-invalid': !isValid }">
        <div class="head">{{ name }}</div>
        <div class="middle">{{ value }}</div>
        <div class="tail">
            <div>
                <span class="control-icon material-icons no-select" @click="onEditClicked()">edit</span>
                <span class="control-icon material-icons no-select" @click="onRemoveClicked()">delete</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FilterHelperService from '@/services/filter-helper.service';
import { Filter } from '@/models/Filter';
export default defineComponent({
    name: 'Filter',
    props: {
        name: String,
        value: String,
        filter: { required: true, type: Object },
    },
    emits: ['edit', 'delete'],
    computed: {
        isValid() {
            return FilterHelperService.isValid(this.$props.filter as Filter);
        },
    },
    methods: {
        /**
         *  @function emits an event remove a filter
         */
        onRemoveClicked(): void {
            this.$emit('delete'); // Emit delete
        },
        /**
         *  @function emits an event to edit a filter
         */
        onEditClicked(): void {
            this.$emit('edit'); // Emit edit
        },
    },
});
</script>

<style lang="scss" scoped>
.filter {
    display: flex;
    width: 100%;
    line-height: 1em;
}
.filter > div {
    border: 1px solid black;
    flex: 1;
    background-color: black;
    color: white;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 2px 5px;
}
.filter.is-invalid > div {
    background-color: #800000;
    border-color: #800000;
}
.filter.is-invalid > .head {
    background-color: white;
    color: #800000;
}
.filter > .head {
    border: 1px solid black;
    border-radius: 1.5em 0 0 1.5em;
    border-right: none;
    background-color: white;
    color: black;
}
.filter > .tail {
    border: 1px solid black;
    border-radius: 0 1.5em 1.5em 0;
    border-left: none;
    text-align: right;
}

.control-icon {
    color: white;
    font-size: 22px;
    cursor: pointer;
}
</style>
