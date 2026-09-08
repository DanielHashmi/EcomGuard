Expo SDK 57 upgrade notes

- Changes applied:
  - Updated `package.json` to use Expo SDK 57 compatible versions for `expo`, `react`, `react-native`, and core Expo packages.
  - Removed unsupported fields from `app.json` flagged by `expo-doctor`.

- Temporary workaround applied (local only):
  - Modified `node_modules/.../VirtualViewExperimentalNativeComponent.js` to change `onModeChange` handler type to `DirectEventHandler<any>` to avoid a codegen parsing error during Metro bundling on Android.
  - This change is a local workaround and should NOT be committed to upstream dependencies.

- Recommended next steps:
  1. Commit and push the dependency and config changes (this repo branch already contains them).
  2. Prefer a permanent fix for the codegen issue: wait for an upstream patch to `react-native`/`@react-native/codegen` or apply a targeted patch in a forked package.
  3. Run native emulator/device tests locally (Android emulator or iOS simulator) and verify runtime behavior.

- To reproduce local validation checks performed:
  - `pnpm install`
  - `npx expo-doctor --verbose` (expect 21/21 checks passed)
  - `npx expo prebuild`
  - `pnpm start --web` (web served at http://localhost:8081)

If you want, I can open a PR with these changes and include this note; or I can prepare an upstream issue/patch for `react-native` codegen.