/* global window */

// Проверка на ie 11
export const isInternetExplorer = () => window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;
