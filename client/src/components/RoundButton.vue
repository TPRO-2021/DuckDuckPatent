<template>
    <button type="button" class="roundButton" @click="onClick" :class="{ 'button-active': isClicked }">
        <span class="btn-icon material-icons">{{ this.iconKey }}</span>
    </button>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Options({
    emits: ['onClicked'],
})
export default class RoundButton extends Vue {
    @Prop({ type: Boolean })
    public isToggle = false;
    @Prop({ type: String })
    public iconKey = '';

    public isClicked = false;
    // when the button is clicked the background color is toggled another color and the parent component Search.vue is informed
    public onClick(): void {
        if (this.isToggle) {
            this.isClicked = !this.isClicked;
            this.$emit('clicked', this.isClicked);
            return;
        }
    }
}
</script>

<style lang="scss" scoped>
.roundButton,
.roundButton:hover,
.button-active,
.button-active:hover {
    transition: all 1s ease;
}

.roundButton {
    float: right;
    background-color: black;
    border: none;
    cursor: pointer;
    border-radius: 100%;
    height: 58px;
    width: 58px;
    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.3);
}

.button-active {
    background: white;
    .btn-icon {
        color: black;
    }
}

.btn-icon {
    color: white;
}
</style>
