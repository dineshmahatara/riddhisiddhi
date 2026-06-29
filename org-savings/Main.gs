/**
 * Web app entry point
 */

function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'dashboard';
  const template = HtmlService.createTemplateFromFile('Index');
  template.page = page;
  template.orgName = CONFIG.DEFAULT_ORG_NAME;
  template.currency = CONFIG.DEFAULT_CURRENCY;

  try {
    template.orgName = getSetting_('orgName', CONFIG.DEFAULT_ORG_NAME);
    template.currency = getSetting_('currency', CONFIG.DEFAULT_CURRENCY);
  } catch (err) {
    // Database not initialized yet — defaults are used
  }

  return template
    .evaluate()
    .setTitle(template.orgName + ' — Savings')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Includes HTML partials (Styles, AppScripts) into Index.html.
 * File names must match exactly — no .html extension in Apps Script.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Savings System')
    .addItem('Initialize Database', 'setupDatabase')
    .addItem('Open Web App', 'openWebApp')
    .addToUi();
}

function openWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    '<p>Deploy as web app first, then use this URL:</p><a href="' + url + '" target="_blank">' + url + '</a>'
  ).setWidth(500).setHeight(100);
  SpreadsheetApp.getUi().showModalDialog(html, 'Web App URL');
}

function setupDatabase() {
  const result = initializeDatabase();
  SpreadsheetApp.getUi().alert(result.message);
}
