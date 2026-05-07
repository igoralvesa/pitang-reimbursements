import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'bun:test';
import { JSDOM } from 'jsdom';
import { TextDecoder, TextEncoder } from 'node:util';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});

const windowProperties = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLSelectElement',
  'HTMLButtonElement',
  'HTMLAnchorElement',
  'HTMLFormElement',
  'HTMLLabelElement',
  'HTMLDivElement',
  'HTMLSpanElement',
  'SVGElement',
  'Element',
  'Node',
  'NodeFilter',
  'Text',
  'DocumentFragment',
  'Event',
  'MouseEvent',
  'PointerEvent',
  'KeyboardEvent',
  'CustomEvent',
  'SubmitEvent',
  'FormData',
  'File',
  'Blob',
  'URL',
  'MutationObserver',
  'getComputedStyle',
  'localStorage',
  'sessionStorage',
] as const;

for (const property of windowProperties) {
  Object.defineProperty(globalThis, property, {
    configurable: true,
    value: dom.window[property],
    writable: true,
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

const getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

Object.defineProperty(globalThis, 'getComputedStyle', {
  configurable: true,
  value: (element: Element, pseudoElt?: string | null) => {
    const styles = getComputedStyle(element, pseudoElt);

    if (!styles.pointerEvents || styles.pointerEvents === 'none') {
      Object.defineProperty(styles, 'pointerEvents', {
        configurable: true,
        value: 'auto',
      });
    }

    return styles;
  },
});

Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  value: globalThis.getComputedStyle,
});

expect.extend(matchers);
