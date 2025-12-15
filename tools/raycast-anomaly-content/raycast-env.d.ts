/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Content Path - Path to the content folder of your Anomaly Scanner project */
  "contentPath": string,
  /** Project Path - Path to the Anomaly Scanner project root */
  "projectPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `add-listening` command */
  export type AddListening = ExtensionPreferences & {}
  /** Preferences accessible in the `add-card` command */
  export type AddCard = ExtensionPreferences & {}
  /** Preferences accessible in the `browse-content` command */
  export type BrowseContent = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-add` command */
  export type QuickAdd = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `add-listening` command */
  export type AddListening = {}
  /** Arguments passed to the `add-card` command */
  export type AddCard = {}
  /** Arguments passed to the `browse-content` command */
  export type BrowseContent = {}
  /** Arguments passed to the `quick-add` command */
  export type QuickAdd = {}
}

