<template>
  <div>
    <!-- <q-menu no-focus self="top start" anchor="bottom start" style="top: unset; bottom: 40px">
      <q-list>
        <template v-for="user in room.users">
          <q-item v-if="users[user.id].displayname.includes(tag)" clickable v-ripple>
            <q-item-section avatar>
              <q-avatar>
                <img :src="users[user.id].avatar" />
              </q-avatar>
            </q-item-section>

            <q-item-section>{{ users[user.id].displayname }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu> -->
    <highlightable-input 
      highlight-style="font-weight:bold" 
      highlight-enabled
      :highlight="highlight" 
      @value-update="(value) => this.inputText=value"
      :users="users"
      :room="room"
    >
    </highlightable-input>
    <!-- <q-input rounded borderless dense bg-color="grey-1" class="full-width" v-model="inputText"
      @update:model-value="handleInput" ref="input" placeholder="Type a message" @keydown.enter="submitMessage">
      <q-menu no-focus self="top start" anchor="bottom start" style="top: unset; bottom: 50px">
        <q-list>
          <template v-for="user in room.users">
            <q-item v-if="users[user.id].displayname.includes(tag)" clickable v-ripple>
              <q-item-section avatar>
                <q-avatar>
                  <img :src="users[user.id].avatar" />
                </q-avatar>
              </q-item-section>

              <q-item-section>{{ users[user.id].displayname }}</q-item-section>
            </q-item>
          </template>

        </q-list>
      </q-menu>
      <span>5252523</span>
    </q-input> -->
   
  </div>
</template>

<script>
import HighlightableInput from "./HighlightableInput.vue"
export default {
  components: {
    HighlightableInput
  },
  props: {
    room: { type: Object, required: true },
    users: { type: Object, required: true }
  },
  data() {
    return {
      inputText: '',
      highlight: [
        "v quan"
      ],
    };
  },
  computed: {
    tag() {
      const index = this.inputText.lastIndexOf('@')
      if (index > -1) {
        if (index > 0) {
          if (this.inputText.charAt(index - 1) != ' ') return null
        }
        const ttag = this.inputText.substring(index + 1)
        if (ttag.lastIndexOf(' ') == -1) {
          return ttag
        }
        else return null
      }
      else return null
    }
  },

  methods: {

  }
};
</script>

<style lang="scss">
.mention {
  background-color: yellow;
  font-weight: bold;
}
</style>
