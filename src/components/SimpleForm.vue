<template>
  <VForm @submit.prevent="onSubmit">
    <VContainer>
      <VRow justify="center">
        <VCol
          cols="12"
          sm="6"
          lg="5"
        >
          <VTextField
            v-model="state.nickname"
            label="Никнейм"
            :error-messages="mapErrorMessages(v$.nickname.$errors)"
            @update:focused="val => handleFocus(val, v$.nickname.$touch)"
          >
            <template v-slot:append-inner>
              <VFadeTransition leave-absolute>
                <VProgressCircular
                  v-if="v$.nickname.$pending"
                  color="info"
                  indeterminate
                  size="24"
                ></VProgressCircular>
                <VIcon
                  v-else-if="!v$.nickname.$invalid"
                  color="success"
                  icon="mdi-check-circle"
                />
                <VIcon
                  v-else-if="v$.nickname.$error"
                  color="error"
                  icon="mdi-alert-circle"
                />
              </VFadeTransition>
            </template>
          </VTextField>
          <VTextField
            v-model="state.email"
            class="mt-2"
            label="Email"
            type="email"
            :error-messages="mapErrorMessages(v$.email.$errors)"
            @update:focused="val => handleFocus(val, v$.email.$touch)"
            @update:model-value="() => backendErrors.email = undefined"
          />

          <VTextField
            v-model="state.password"
            :append-inner-icon="passwordIsVisible ? 'mdi-eye' : 'mdi-eye-off'"
            class="mt-2"
            label="Пароль"
            :type="passwordIsVisible ? 'text' : 'password'"
            counter
            :error-messages="mapErrorMessages(v$.password.$errors)"
            @click:append-inner="passwordIsVisible = !passwordIsVisible"
            @update:focused="val => handleFocus(val, v$.password.$touch)"
          />

          <VTextField
            v-model="state.confirmPassword"
            :append-inner-icon="passwordIsVisible ? 'mdi-eye' : 'mdi-eye-off'"
            class="mt-2"
            label="Повторите пароль"
            :type="confirmPasswordIsVisible ? 'text' : 'password'"
            counter
            :error-messages="mapErrorMessages(v$.confirmPassword.$errors)"
            @click:append-inner="confirmPasswordIsVisible = !confirmPasswordIsVisible"
            @update:focused="val => handleFocus(val, v$.confirmPassword.$touch)"
          />

          <VTextField
            v-model="state.dateOfBirth"
            class="mt-2"
            label="День рождения"
            type="date"
            :error-messages="mapErrorMessages(v$.dateOfBirth.$errors)"
            @update:focused="val => handleFocus(val, v$.dateOfBirth.$touch)"
          />

          <VCheckbox
            v-model="state.policyAgreement"
            label="Принимаю всякие там соглашения"
            :error-messages="mapErrorMessages(v$.policyAgreement.$errors)"
            @update:focused="val => handleFocus(val, v$.policyAgreement.$touch)"
          />

          <VBtn
            class="mt-4"
            type="submit"
            variant="text"
            color="primary"
            :disabled="v$.$error"
            :loading="isLoading.submit"
          >
            Отправить
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>
  </VForm>
</template>

<script lang="ts" setup>
import {
  reactive,
  ref,
  computed,
} from 'vue';
import {
  useVuelidate,
  ErrorObject,
} from '@vuelidate/core';
import {
  helpers,
  sameAs,
} from '@vuelidate/validators'
import {
  DateTime,
} from 'luxon'
import debounce from 'debounce-async'


import {
  checkNicknameForUniqRequest,
  submitFormRequest,
  ApiError,
} from '@/api/simpleForm'
import {
  required,
  email,
  minLength,
} from '@/helpers/validators'

const debouncedRequest = debounce(checkNicknameForUniqRequest, 200, { cancelObj: false })

const NICKNAME_MIN_LENGTH = 3

const passwordIsVisible = ref(false)
const confirmPasswordIsVisible = ref(false)

const isLoading = reactive({
  submit: false,
})

const checkNicknameForUniq = (value: string) => {
  if (!value || value.length < NICKNAME_MIN_LENGTH) {
    return false
  }

  return debouncedRequest(value).catch(() => {
    return false
  })
}

const state = reactive({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  policyAgreement: false,
})
const backendErrors = ref<Partial<Record<keyof typeof state, string[]>>>({})


const rules = computed(() => ({
  nickname: {
    required,
    minLength: minLength(NICKNAME_MIN_LENGTH),
    isUniq: helpers.withMessage(
      ({ $pending }) => {
          if (!$pending) return 'Такой никнейм уже занят';
          return '';
      },
      helpers.withAsync(checkNicknameForUniq),
    ),
  },
  email: {
    required,
    email,
  },
  password: {
    required,
    regexp: helpers.withMessage(
      'Пароль должен иметь длину 4-8 символов, содержать 1 строчную букву, 1 заглавную, 1 цифру, без пробелов',
      helpers.regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{4,8}$/),
    )
  },
  confirmPassword: {
    required,
    sameAs: helpers.withMessage(
      'Пароли не совпадают',
      sameAs(state.password),
    )
  },
  dateOfBirth: {
    required,
    mustBeInPast: helpers.withMessage(
      'Дата не может быть больше сегодняшней',
      (value: string) => {
        if (!helpers.req(value)) {
          return false
        }

        const date = DateTime.fromISO(value);
        const today = DateTime.now().plus({ day: 1 }).startOf('day');

        return date < today
      },
    )
  },
  policyAgreement: {
    checked: helpers.withMessage(
      'Необходимо дать согласие',
      (value: boolean) => value,
    ),
  }
}))

const mapErrorMessages = (errors: ErrorObject[]): string[] => {
  return errors
    .map(({ $message }) => $message.toString())
    .filter(message => !!message)
}

const v$ = useVuelidate(rules, state, { $externalResults: backendErrors })

const onSubmit = async () => {
  const isValid = await v$.value.$validate()
  if (!isValid) {
    return
  }

  try {
    isLoading.submit = true

    await submitFormRequest(state)
    alert(`Успешно отправлено ${JSON.stringify(state)}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === '422') {
      backendErrors.value = err.params
      return
    }

    throw err
  } finally {
    isLoading.submit = false
  }
}

const handleFocus = (isFocused: boolean, callback: () => void) => {
  if (!isFocused) {
    callback()
  }
}
</script>
