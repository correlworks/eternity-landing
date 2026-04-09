import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const tsvPath = path.join(root, '_i18n_tsv.txt');
const outPath = path.join(root, 'i18n-eternity-landing.js');

const lines = fs.readFileSync(tsvPath, 'utf8').trim().split(/\r?\n/);
const ja = {};
const zhTW = {};
const ms = {};
const fil = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split('\t');
  if (parts.length !== 5) {
    throw new Error(`Line ${i + 1} (${parts[0]}): expected 5 columns, got ${parts.length}`);
  }
  const [key, a, b, c, d] = parts;
  ja[key] = a;
  zhTW[key] = b;
  ms[key] = c;
  fil[key] = d;
}

const zhHK = {
  ...zhTW,
  meta_title: '貝貝天鵝 ETERNITY — 背心式嬰兒揹帶（香港繁體）',
  meta_desc:
    '背心式兩步穿脫，可變身增高座並配合汽車安全座椅。貝貝天鵝 ETERNITY，適合香港及各地家庭。',
};

const jsonT = JSON.stringify({ ja, 'zh-TW': zhTW, 'zh-HK': zhHK, ms, fil });

const runtime = `/**
 * BEBESWAN ETERNITY landing — generated from _i18n_tsv.txt (scripts/build-i18n-from-tsv.mjs)
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bebeswan_eternity_lang';
  var LANGS = ['ko', 'ja', 'zh-TW', 'zh-HK', 'ms', 'fil'];

  var T = ${jsonT};

  var originals = { html: {}, alt: {}, aria: {}, title: '', metaDesc: '' };
  var captured = false;

  function captureOriginals() {
    if (captured) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (k) originals.html[k] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt');
      if (k) originals.alt[k] = el.getAttribute('alt') || '';
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (k) originals.aria[k] = el.getAttribute('aria-label') || '';
    });
    originals.title = document.title;
    var meta = document.getElementById('metaDesc');
    originals.metaDesc = meta ? meta.getAttribute('content') || '' : '';
    captured = true;
  }

  function applyLang(code) {
    if (LANGS.indexOf(code) === -1) code = 'ko';
    captureOriginals();
    var isKo = code === 'ko';
    var dict = isKo ? null : T[code];

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!k) return;
      var v = isKo ? originals.html[k] : dict[k] != null ? dict[k] : originals.html[k];
      if (v != null) el.innerHTML = v;
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt');
      if (!k) return;
      var v = isKo ? originals.alt[k] : dict[k] != null ? dict[k] : originals.alt[k];
      if (v != null) el.setAttribute('alt', v);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (!k) return;
      var v = isKo ? originals.aria[k] : dict[k] != null ? dict[k] : originals.aria[k];
      if (v != null) el.setAttribute('aria-label', v);
    });

    document.documentElement.setAttribute('lang', code);

    var meta = document.getElementById('metaDesc');
    if (isKo) {
      document.title = originals.title;
      if (meta) meta.setAttribute('content', originals.metaDesc);
    } else {
      if (dict.meta_title) document.title = dict.meta_title;
      if (meta && dict.meta_desc) meta.setAttribute('content', dict.meta_desc);
    }

    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) {}

    var sel = document.getElementById('langSelect');
    if (sel) sel.value = code;
  }

  document.addEventListener('DOMContentLoaded', function () {
    captureOriginals();
    var sel = document.getElementById('langSelect');
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    if (saved && LANGS.indexOf(saved) !== -1 && saved !== 'ko') {
      applyLang(saved);
    } else if (sel) {
      sel.value = 'ko';
    }
    if (sel) {
      sel.addEventListener('change', function () {
        applyLang(sel.value);
      });
    }
  });
})();

`;

fs.writeFileSync(outPath, runtime, 'utf8');
console.log('Wrote', outPath);
