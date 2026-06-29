/**
 * Database initialization and sheet access
 */

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');

  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      props.deleteProperty('SPREADSHEET_ID');
    }
  }

  const files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
  if (files.hasNext()) {
    const ss = SpreadsheetApp.open(files.next());
    props.setProperty('SPREADSHEET_ID', ss.getId());
    return ss;
  }

  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function getSheet_(name) {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = HEADERS[name.replace(/\s/g, '')] || HEADERS[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1a73e8')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function initializeDatabase() {
  Object.values(CONFIG.SHEETS).forEach(function (name) {
    getSheet_(name);
  });

  seedDefaultSettings_();
  seedBootstrapAdmin_();

  return {
    success: true,
    message: 'Database initialized. Spreadsheet: ' + getSpreadsheet_().getUrl()
  };
}

function seedDefaultSettings_() {
  const defaults = {
    orgName: CONFIG.DEFAULT_ORG_NAME,
    currency: CONFIG.DEFAULT_CURRENCY,
    minWithdrawal: '10',
    requireApproval: 'true',
    fiscalYearStart: '01'
  };

  Object.keys(defaults).forEach(function (key) {
    if (!getSetting_(key)) {
      setSetting_(key, defaults[key]);
    }
  });
}

function seedBootstrapAdmin_() {
  const email = Session.getActiveUser().getEmail();
  if (!email) return;

  const members = getAllRows_(CONFIG.SHEETS.MEMBERS);
  if (members.length === 0) {
    addMember_({
      email: email,
      name: email.split('@')[0],
      role: CONFIG.ROLES.ADMIN,
      phone: '',
      notes: 'Bootstrap administrator'
    });
  }
}

function getAllRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  return data.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    return obj;
  }).filter(function (row) {
    return row.id || row.email || row.key;
  });
}

function appendRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (h) {
    return obj[h] !== undefined ? obj[h] : '';
  });
  sheet.appendRow(row);
  return obj;
}

function updateRow_(sheetName, id, updates) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      headers.forEach(function (h, col) {
        if (updates[h] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(updates[h]);
        }
      });
      return true;
    }
  }
  return false;
}

function findRow_(sheetName, field, value) {
  const rows = getAllRows_(sheetName);
  return rows.find(function (r) {
    return String(r[field]).toLowerCase() === String(value).toLowerCase();
  }) || null;
}

function generateId_(prefix) {
  return prefix + '_' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

function getSetting_(key, defaultValue) {
  const row = findRow_(CONFIG.SHEETS.SETTINGS, 'key', key);
  return row ? row.value : (defaultValue || '');
}

function setSetting_(key, value) {
  const sheet = getSheet_(CONFIG.SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(String(value));
      return;
    }
  }

  appendRow_(CONFIG.SHEETS.SETTINGS, { key: key, value: String(value) });
}

function logAudit_(action, entity, entityId, details) {
  appendRow_(CONFIG.SHEETS.AUDIT, {
    id: generateId_('AUD'),
    action: action,
    entity: entity,
    entityId: entityId || '',
    userEmail: Session.getActiveUser().getEmail() || 'system',
    details: typeof details === 'string' ? details : JSON.stringify(details),
    timestamp: new Date().toISOString()
  });
}
