import {
  required as vRequired,
  email as vEmail,
  minLength as vMinLength,
  helpers,
} from '@vuelidate/validators';

export const required = helpers.withMessage('Обязательное поле', vRequired);

export const email = helpers.withMessage('Некорректный email', vEmail);

export const minLength = (param: number) => helpers.withMessage(
  ({ $params }) => `Минимум ${$params.min} символов.`,
  vMinLength(param),
)
