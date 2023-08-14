import * as constants from '../assets/constants';

export default async ({ app }) => {
  Object.keys(constants).forEach(key => {
    app.config.globalProperties[key] = constants[key];
  });
};