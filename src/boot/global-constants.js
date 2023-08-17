import * as constants from "../assets/constants";
import { boot } from "quasar/wrappers";

export default boot(({ app }) => {

  Object.keys(constants).forEach(key => {
    app.config.globalProperties[key] = constants[key];
  });
});
