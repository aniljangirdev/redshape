const cleanStack = require('clean-stack');
const ensureError = require('ensure-error');
const isDev = require('electron-is-dev');
const { app, dialog, clipboard } = require('electron');

const { report } = require('./reporter');

const config = {
  showDialog: !isDev,
  reportButton: report
};

let installed = false;

const handleError = (title, err) => {
  const error = ensureError(err);

  console.error(error);

  if (config.showDialog) {
    const stack = cleanStack(error.stack);

    if (app.isReady()) {
      const buttons = [
        'OK',
        process.platform === 'darwin' ? 'Copy Error' : 'Copy error'
      ];

      if (config.reportButton) {
        buttons.push('Report…');
      }

      // Intentionally not using the `title` option as it's not shown on macOS
      const buttonIndex = dialog.showMessageBox({
        type: 'error',
        buttons,
        defaultId: 0,
        noLink: false,
        message: title,
        detail: cleanStack(error.stack, { pretty: true })
      });

      if (buttonIndex === 1) {
        clipboard.writeText(`${title}\n${stack}`);
      }

      if (buttonIndex === 2) {
        config.reportButton(error);
      }
    } else {
      dialog.showErrorBox(title, stack);
    }
  }
};

module.exports = (options = {}) => {
  if (installed) return;

  installed = true;

  if (options) {
    Object.assign(config, options);
  }

  process.on('uncaughtException', error => handleError('Unhandled Error', error));
  process.on('unhandledRejection', error => handleError('Unhandled Promise Rejection', error));
};
