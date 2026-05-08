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
globalThis.IS_REACT_ACT_ENVIRONMENT = false;

const pointerCaptureElementPrototypes = [
  dom.window.Element.prototype,
  dom.window.HTMLElement.prototype,
  dom.window.SVGElement.prototype,
];

for (const prototype of pointerCaptureElementPrototypes) {
  if (!prototype.hasPointerCapture) {
    prototype.hasPointerCapture = () => false;
  }

  if (!prototype.releasePointerCapture) {
    prototype.releasePointerCapture = () => {};
  }

  if (!prototype.setPointerCapture) {
    prototype.setPointerCapture = () => {};
  }
}

if (!dom.window.Element.prototype.scrollIntoView) {
  dom.window.Element.prototype.scrollIntoView = () => {};
}

const requestAnimationFrameMock = (callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(Date.now()), 0);
const cancelAnimationFrameMock = (handle: number) => window.clearTimeout(handle);

Object.defineProperty(globalThis, 'requestAnimationFrame', {
  configurable: true,
  value: requestAnimationFrameMock,
});

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  configurable: true,
  value: cancelAnimationFrameMock,
});

Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  value: requestAnimationFrameMock,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  value: cancelAnimationFrameMock,
});

const originalConsoleError = console.error.bind(console);

console.error = (...args: unknown[]) => {
  const firstArg = args[0];

  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('was not wrapped in act') ||
      firstArg.includes('A component suspended inside an `act` scope'))
  ) {
    return;
  }

  originalConsoleError(...args);
};

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
