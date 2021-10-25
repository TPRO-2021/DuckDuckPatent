<template>
    <div class="button" @click="$emit('onClicked')" :class="{ 'button-large': $props.size === 'large' }">
        <div class="button-container">
            <!-- The icon-->
            <div class="material-icons" v-if="iconKey">
                <span>{{ iconKey }}</span>
            </div>
            <!-- The text -->
            <div class="btn-text">
                <span>{{ btnText }}</span>
            </div>
        </div>
        <div :class="{ hide: !hasBadge }" class="button-badge">{{ badgeValue }}</div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Simple component which provides a button.
 *
 * The button text can be modified with the property btnText.
 * Additionally an icon can be passed to the button using the iconKey value.
 *
 * This component uses google icons (https://fonts.google.com/icons)
 *
 * Once the button is pressed it emits an event called 'onClicked'
 * which can be handled by the parent component using @on-clicked="handler"
 *
 * */
export default defineComponent({
    name: 'Button',
    props: {
        btnText: String,
        iconKey: String,
        badgeValue: String,
        size: {
            type: String,
            default: 'large',
        },
    },
    emits: ['onClicked'],
    computed: {
        hasBadge(): boolean {
            if (!this.badgeValue) {
                return false;
            }

            return this.badgeValue.trim().length !== 0;
        },
    },
});
</script>

<style lang="scss" scoped>
.button {
    background: #000000;
    border-radius: 90px;
    border: none;
    padding: 6px 16px;
}

.button-container {
    display: flex;
    align-items: center;
    gap: 18px;
}

.button:hover {
    cursor: pointer;
}

.material-icons {
    color: white;
    display: table-row;
    vertical-align: middle;
}

.btn-text {
    color: white;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    text-align: center;
}

.hide {
    display: none;
}

.button-badge {
    animation: zoom 500ms forwards;
    position: absolute;
    top: -10px;
    right: -10px;
    width: 26px;
    height: 26px;
    background-color: #ff0000;
    border-radius: 50%;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    color: white;
    font-size: 16px;
}

@keyframes zoom {
    0% {
        opacity: 0;
        transform: scale(0);
    }
    10% {
        opacity: 0.3;
        transform: scale(0.3);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
