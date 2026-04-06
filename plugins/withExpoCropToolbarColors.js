/**
 * expo-image-picker kırpma ekranı: varsayılan şeffaf toolbar rengi ve AppCompat pencere
 * arka planı üstte/çevrede gri katman gibi görünür. Opak renkler, özel tema (windowBackground,
 * status/navigation bar) ve kontrast zorlamasını kapatma ile düzeltir.
 */
const fs = require('fs');
const path = require('path');
const {
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins');
const { assignColorValue } = require('@expo/config-plugins/build/android/Colors');
const { assignStylesValue } = require('@expo/config-plugins/build/android/Styles');
const { ensureToolsAvailable } = require('@expo/config-plugins/build/android/Manifest');

const CROP_THEME = { name: 'Theme.ExpoCropImageFix', parent: 'Base.Theme.AppCompat' };

function addCropThemeItems(xml, { lightStatusBar }) {
  const items = [
    ['android:statusBarColor', '@color/expoCropToolbarColor'],
    ['android:navigationBarColor', '@color/expoCropToolbarColor'],
    ['android:windowBackground', '@color/expoCropBackgroundColor'],
    ['android:colorBackground', '@color/expoCropBackgroundColor'],
    ['android:windowDrawsSystemBarBackgrounds', 'true'],
    ['android:windowLightStatusBar', lightStatusBar ? 'true' : 'false'],
    ['android:enforceStatusBarContrast', 'false'],
    ['android:enforceNavigationBarContrast', 'false'],
    ['expoCropToolbarColor', '@color/expoCropToolbarColor'],
    ['expoCropBackgroundColor', '@color/expoCropBackgroundColor'],
  ];
  let out = xml;
  for (const [name, value] of items) {
    out = assignStylesValue(out, {
      add: true,
      parent: CROP_THEME,
      name,
      value,
      targetApi:
        name === 'android:enforceStatusBarContrast' || name === 'android:enforceNavigationBarContrast'
          ? '29'
          : undefined,
    });
  }
  return out;
}

function withExpoCropToolbarColors(config) {
  config = withAndroidColors(config, (cfg) => {
    let xml = cfg.modResults;
    xml = assignColorValue(xml, { name: 'expoCropToolbarColor', value: '#FFFFFFFF' });
    xml = assignColorValue(xml, { name: 'expoCropBackgroundColor', value: '#FFFFFFFF' });
    cfg.modResults = xml;
    return cfg;
  });

  config = withAndroidColorsNight(config, (cfg) => {
    let xml = cfg.modResults;
    xml = assignColorValue(xml, { name: 'expoCropToolbarColor', value: '#FF000000' });
    xml = assignColorValue(xml, { name: 'expoCropBackgroundColor', value: '#FF000000' });
    cfg.modResults = xml;
    return cfg;
  });

  config = withAndroidStyles(config, (cfg) => {
    cfg.modResults = addCropThemeItems(cfg.modResults, { lightStatusBar: true });
    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const nightPath = path.join(root, 'app/src/main/res/values-night/styles_expo_crop_fix.xml');
      await fs.promises.mkdir(path.dirname(nightPath), { recursive: true });
      await fs.promises.writeFile(
        nightPath,
        `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
  <style name="Theme.ExpoCropImageFix" parent="Base.Theme.AppCompat">
    <item name="android:statusBarColor">@color/expoCropToolbarColor</item>
    <item name="android:navigationBarColor">@color/expoCropToolbarColor</item>
    <item name="android:windowBackground">@color/expoCropBackgroundColor</item>
    <item name="android:colorBackground">@color/expoCropBackgroundColor</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <item name="android:windowLightStatusBar">false</item>
    <item name="android:enforceStatusBarContrast" tools:targetApi="29">false</item>
    <item name="android:enforceNavigationBarContrast" tools:targetApi="29">false</item>
    <item name="expoCropToolbarColor">@color/expoCropToolbarColor</item>
    <item name="expoCropBackgroundColor">@color/expoCropBackgroundColor</item>
  </style>
</resources>
`,
        'utf8'
      );
      return cfg;
    },
  ]);

  config = withAndroidManifest(config, (cfg) => {
    const manifest = ensureToolsAvailable(cfg.modResults);
    const app = manifest.manifest.application[0];
    if (!app.activity) app.activity = [];
    const list = Array.isArray(app.activity) ? app.activity : [app.activity];
    const targetName = 'expo.modules.imagepicker.ExpoCropImageActivity';
    const existing = list.find((a) => a?.$?.['android:name'] === targetName);
    if (existing) {
      existing.$['android:theme'] = '@style/Theme.ExpoCropImageFix';
      existing.$['tools:replace'] = 'android:theme';
    } else {
      list.push({
        $: {
          'android:name': targetName,
          'android:theme': '@style/Theme.ExpoCropImageFix',
          'tools:replace': 'android:theme',
        },
      });
    }
    app.activity = list;
    cfg.modResults = manifest;
    return cfg;
  });

  return config;
}

module.exports = withExpoCropToolbarColors;
