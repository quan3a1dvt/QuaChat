<template>
  <div style="z-index: 4; position: absolute; top: 25px; color: red">{{ this.text }}</div>
  <Mentionable
    placement="bottom"
    :keys="['@', '#']"
    :items="items"
    offset="6"
    insert-space
    @open="onOpen"
  >
    <q-input
      class="input"
      placeholder="Enter text and then type # to trigger the mention"
      v-model="text"
    />

    <template #no-result>
      <div class="dim">No result</div>
    </template>

    <template #item-@="{ item }">
      <div class="user">
        {{ item.value }}
        <span class="dim">({{ item.firstName }})</span>
      </div>
    </template>

    <template #item-#="{ item }">
      <div class="issue">
        <span class="number">#{{ item.value }}</span>
        <span class="dim">{{ item.label }}</span>
      </div>
    </template>
  </Mentionable>
</template>

<script>
import { Mentionable } from "vue-mention";

const users = [
  {
    value: "akryum",
    firstName: "Guillaume",
  },
  {
    value: "posva",
    firstName: "Eduardo",
  },
  {
    value: "atinux",
    firstName: "Sébastien",
  },
];

const issues = [
  {
    value: 123,
    label: "Error with foo bar",
    searchText: "foo bar",
  },
  {
    value: 42,
    label: "Cannot read line",
    searchText: "foo bar line",
  },
  {
    value: 77,
    label: "I have a feature suggestion",
    searchText: "feature",
  },
];

export default {
  components: {
    Mentionable,
  },

  data() {
    return {
      text: "",
      items: [],
    };
  },

  methods: {
    onOpen(key) {
      this.items = key === "@" ? users : issues;
    },
  },
};
</script>

<style scoped>
body {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 32px;
}

.input {
  width: 500px;
}

.mention-item {
  padding: 4px 10px;
  border-radius: 4px;
}

.mention-selected {
  background: rgb(192, 250, 153);
}
</style>
