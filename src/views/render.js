import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const directory = fileURLToPath(new URL('./', import.meta.url));

export function renderView(name = 'layout', data = {}, ancestors = []) {
  if (!/^[a-z/-]+$/.test(name) || ancestors.includes(name)) {
    throw new Error(`Invalid or recursive view: ${name}`);
  }
  return readFileSync(`${directory}${name}.html`, 'utf8').replace(
    /\{\{> ([a-z/-]+)\}\}/g,
    (_, partial) => renderView(partial, data, [...ancestors, name])
  ).replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => data[key] ?? '');
}
