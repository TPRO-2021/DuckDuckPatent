<template>
    <label for="_button" :class="{ active: isActive }" class="toggle__button">
        <input type="checkbox" id="_button" v-model="checkedValue" />
        <span class="toggle__switch"></span>
    </label>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop, Emit, Watch } from 'vue-property-decorator';

@Options({
    emits: ['onClicked'],
})
export default class ToggleSwitch extends Vue {
    @Prop({ type: Boolean })
    private disabled = false;

    @Prop({ type: Boolean })
    private defaultState = false;

    @Emit()
    switch(): boolean {
        return this.currentState;
    }

    currentState: boolean = this.defaultState;

    get isActive(): boolean {
        return this.currentState;
    }

    get checkedValue(): boolean {
        return this.currentState;
    }

    set checkedValue(newValue: boolean) {
        this.currentState = newValue;
    }

    @Watch('defaultState')
    onPropertyChanged(): void {
        this.currentState = this.defaultState;
    }
}
</script>

<style lang="scss" scoped>
$base-darken: black;
$base-active-darken: #a88529;

.toggle__button {
    vertical-align: center;
    user-select: none;
    cursor: pointer;
    input[type='checkbox'] {
        opacity: 0;
        position: absolute;
        width: 1px;
        height: 1px;
    }

    .toggle__switch {
        display: inline-block;
        height: 19px;
        border-radius: 90px;
        width: 44px;
        background: white;
        box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.25);
        border: 0.25px solid #d6d4d4;
        position: relative;
        transition: all 0.25s;

        &:after,
        &:before {
            content: '';
            position: absolute;
            display: inline-block;
            height: 19px;
            width: 24px;
            border-radius: 90px;
            border: 0.25px solid #d6d4d4;
            left: 0;
            top: -3px;
            transform: translateX(0);
            transition: all 0.3s cubic-bezier(0.5, -0.3, 0.5, 1.3);
        }

        &:after {
            background: $base-darken;
        }

        &:before {
            background: $base-darken;
            opacity: 0;
        }
    }
}

.active {
    .toggle__switch {
        background: white;
        border: 0.25px solid #d6d4d4;
        box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.25);

        &:before,
        &:after {
            transform: translateX(0px);
        }

        &:after {
            left: 17px;
            background: $base-active-darken;
            box-shadow: 0 0 1px $base-active-darken;
        }
    }
}
</style>
