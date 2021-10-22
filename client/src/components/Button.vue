<template>
    <button class="button" @click="$emit('onClicked')">
        <!-- The icon-->
        <div class="material-icons">
            <span>{{ iconKey }}</span>
        </div>
        <!-- The text -->
        <div class="btn-text">
            <span>{{ btnText }}</span>
        </div>
        <div :class="{ hide: !hasBadge }">
            <span class="button-badge">{{ badgeValueDisplay(badgeValue) }}</span>
        </div>
    </button>
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
    },

    emits: ['onClicked'],

    data() {
        return {
            hasBadge: false,
        };
    },

    methods: {
        /**\
         * The length of savedPatents array will be given from parent page to Child button component
         * If the length is 0 or not define the count button is deleted from DOM otherwise the red count button is
         * displayed
         * @param badgeValue
         */
        badgeValueDisplay(badgeValue: string): string | void {
            if (parseInt(badgeValue) <= 0 || badgeValue == undefined || badgeValue == '') {
                this.hasBadge = false;
                return;
            } else {
                this.hasBadge = true;
                return badgeValue;
            }
        },
    },
});
</script>

<style lang="scss" scoped>
.button {
    position: relative;
    background: #000000;
    border-radius: 90px;
    border: none;
    min-width: 153px;
    max-width: 230px;
    min-height: 41px;
    max-height: 44.13px;
}
.button:hover {
    cursor: pointer;
}

.material-icons {
    color: white;
    font-size: 36px;
    display: table-row;
    vertical-align: middle;
    float: left;
    margin-left: 13px;
    margin-right: 18px;
}

.btn-text {
    color: white;
    //font-family: Saira;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    float: left;
    text-align: center;
    margin-right: 23px;
}
.hide {
    display: none;
}
.button-badge {
    animation: zoom 500ms forwards;
    position: absolute;
    top: -35%;
    right: 0;
    width: 26px;
    height: 26px;
    background-color: #ff0000;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    margin-bottom: 16px;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    color: white;
    //font-family: Saira;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    line-height: 31px;
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
