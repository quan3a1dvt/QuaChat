<template>
  <q-layout view="lhr lpr lfr">
    <q-page-container>

      <q-page class="window-height window-width row justify-center items-center" style="background-color: #009688">
          <div class="column">
          <div class="row">
              <h5 class="text-h5 text-white q-my-md">Company & Co</h5>
          </div>
          <div class="row">
              <q-card square bordered class="q-pa-lg shadow-1">
                <!-- <q-card-section>
                    <q-form class="q-gutter-md">
                    <q-input square filled clearable v-model="email" type="email" label="email" />
                    <q-input square filled clearable v-model="password" type="password" label="password" />
                    </q-form>
                </q-card-section>
                <q-card-actions class="q-px-md">
                    <q-btn unelevated color="light-green-7" size="lg" class="full-width" label="Login" />
                </q-card-actions>
                <q-card-section class="text-center q-pa-none">
                    <p class="text-grey-6">Not reigistered? Created an Account</p>
                </q-card-section> -->
                <q-tabs v-model="tab" class="text-teal">
                  <q-tab label="Login" name="login" />
                  <q-tab label="Register" name="register" />
                </q-tabs>

                <q-separator />

                <q-tab-panels v-model="tab" animated>
                  <q-tab-panel name="login">
                    <q-card-section>
                      <q-form class="q-gutter-md">
                        <q-input filled clearable v-model="loginEmail" type="email" label="Email" />
                        <q-input v-model="loginPassword" filled :type="isPwd ? 'password' : 'text'" label="Password">
                          <template v-slot:append>
                            <q-icon
                              :name="isPwd ? 'visibility_off' : 'visibility'"
                              class="cursor-pointer"
                              @click="isPwd = !isPwd"
                            />
                          </template>
                        </q-input>
                      </q-form>
                    </q-card-section>
                    <q-card-actions class="q-px-md">
                      <q-btn unelevated color="light-green-7" size="lg" class="full-width" label="Login" @click="Login"/>
                    </q-card-actions>
                  </q-tab-panel>

                  <q-tab-panel name="register">
                    <q-card-section>
                      <q-form class="q-gutter-md">
                        <q-input filled clearable v-model="registerUsername" type="text" label="Username" />
                        <q-input filled clearable v-model="registerEmail" type="email" label="Email" />
                        <q-input v-model="registerPassword" filled type="password" label="Password"/>
                        <q-input v-model="registerConfirmPassword" filled type="password" label="Confirm Password"/>
                      </q-form>
                    </q-card-section>
                    <q-card-actions class="q-px-md">
                      <q-btn unelevated color="light-green-7" size="lg" class="full-width" label="Register" @click="Register"/>
                    </q-card-actions>
                  </q-tab-panel>
                </q-tab-panels>
              </q-card>
          </div>
          </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
  
<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch
} from 'vue'
import {
  useRouter
} from 'vue-router';
import axios from 'axios'
import Cookies from 'js-cookie'
const ip = 'localhost'
console.log(ip)
const router = useRouter()
const tab = ref('login')
const isPwd = ref(true)
const loginEmail = ref('')
const loginPassword = ref('')
const Login = (async () => {
  let result = await axios.get(`http://${ip}:3000/login?email=${loginEmail.value}&password=${loginPassword.value}`)
  console.log(result)
  if (result.status == 200) {
    Cookies.set('access_token', result.data.accessToken)
    localStorage.setItem("user_id", result.data.user.id)
    router.push({ path: '/chat' })
  }
  else {
      // wrongInfo.value = true
  }
})
const registerUsername = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const Register = (async () => {
  let result = await axios.get(`http://${ip}:3000/register?email=${registerEmail.value}&password=${registerPassword.value}&username=${registerUsername.value}`)
  if (result.status == 200) {
    if (result.data.msg == 'success') {
      routes.push('/')
    }
    else {   
    }
  }
})
</script>
  
  <style lang="scss"> 
  .q-card {
    width: 360px;
  }
  </style>