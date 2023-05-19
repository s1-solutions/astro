// organize-imports-ignore
export { pathToPosix } from './lib/utils';
export { alert, ByteLengthQueuingStrategy, cancelAnimationFrame, cancelIdleCallback, CanvasRenderingContext2D, CharacterData, clearTimeout, Comment, CountQueuingStrategy, crypto, CSSStyleSheet, CustomElementRegistry, CustomEvent, Document, DocumentFragment, DOMException, Element, Event, EventTarget, HTMLBodyElement, HTMLCanvasElement, HTMLDivElement, HTMLDocument, HTMLElement, HTMLHeadElement, HTMLHtmlElement, HTMLImageElement, HTMLSpanElement, HTMLStyleElement, HTMLTemplateElement, HTMLUnknownElement, Image, ImageData, IntersectionObserver, MediaQueryList, MutationObserver, Node, NodeFilter, NodeIterator, OffscreenCanvas, ReadableByteStreamController, ReadableStream, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableStreamDefaultController, ReadableStreamDefaultReader, requestAnimationFrame, requestIdleCallback, ResizeObserver, setTimeout, ShadowRoot, structuredClone, StyleSheet, Text, TransformStream, TreeWalker, URLPattern, Window, WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter, } from './mod.js';
export declare const polyfill: {
    (target: any, options?: PolyfillOptions): any;
    internals(target: any, name: string): any;
};
interface PolyfillOptions {
    exclude?: string | string[];
    override?: Record<string, {
        (...args: any[]): any;
    }>;
}