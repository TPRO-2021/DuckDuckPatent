<template>
    <div class="main-container box-shadow card">
        <div class="menu">
            <div class="scrollbtn">
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 15px"
                    icon-key="more_horiz"
                    @click="scrollMenu = check()"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="push_pin"
                    v-show="scrollMenu === true"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="visibility_off"
                    v-show="scrollMenu === true"
                    @click="showText = checkVisibility()"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="done"
                    v-show="scrollMenu === true"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="read_more"
                    v-show="scrollMenu === true"
                />
            </div>
        </div>
        <div class="info-style" v-show="showText === true">
            <!--            <textarea id="textarea">-->
            <h1 id="title">{{ info.at(0).title }}</h1>

            <h2 id="abstract">{{ info.at(0).abstract }}</h2>
            <p id="description">
                {{ info.at(0).fulltext }}
            </p>

            <!--            </textarea>-->
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';

export default defineComponent({
    name: 'PatentPreview',
    components: { RoundButton },
    props: {
        info: Array,
    },
    data() {
        return {
            scrollMenu: false,
            showText: false,
        };
    },
    methods: {
        check(): boolean {
            if (this.scrollMenu == false) {
                return true;
            } else {
                return false;
            }
        },
        checkVisibility(): boolean {
            if (this.showText == false) {
                return true;
            } else {
                return false;
            }
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: start;
    flex-direction: column;
    transition: 0.5s;
    position: absolute;
}
.scrollbtn {
    float: right;
    width: 40px;
    left: 500px;
    //top: -175px;
    justify-content: space-evenly;
    //align-items: center;
    position: relative;
}
.round-button {
    width: 40px;
    height: 40px;
}
.menu {
    display: flex;
    justify-content: start;
    position: absolute;
}
.info-style {
    justify-content: start;
    transition: 0.5s;
    float: right;
}

#title {
    text-align: left;
    padding-right: 30px;
}
#abstract,
#description {
    text-align: left;
    padding-right: 50px;
}
</style>
