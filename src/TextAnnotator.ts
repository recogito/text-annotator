import { createAnonymousGuest, type AnnotationLayer, type User, createLifecyleObserver } from '@annotorious/core';
import type { TextAnnotation } from './model/TextAnnotation';
import { SelectionHandler } from './SelectionHandler';
import { createTextStore } from './state';
import { createHighlightLayer } from './highlight/highlightLayer';
import type { TextAnnotatorOptions } from './TextAnnotatorOptions';

import './TextAnnotator.css';
import { createPainter } from './presence/PresencePainter';

export type TextAnnotationLayer = AnnotationLayer<TextAnnotation> & ReturnType<typeof TextAnnotator>;

export const TextAnnotator = (container: HTMLElement, options: TextAnnotatorOptions = {}) => {

  const store = createTextStore(container);

  const lifecycle = createLifecyleObserver(store.selection, store);

  store.hover.subscribe(id => {
    console.log('hover change', id ? store.getAnnotation(id) : null);
  });

  let currentUser = options.readOnly ? null : createAnonymousGuest();

  const highlightLayer = createHighlightLayer(container, store);

  const selectionHandler = SelectionHandler(container, store);
  selectionHandler.setUser(currentUser);

  const setUser = (user: User) => {
    currentUser = user;
    selectionHandler.setUser(user);
  }

  const getUser = () => currentUser;

  // Hack
  const setPresenceProvider = (provider: any) =>
    highlightLayer.setPainter(createPainter(provider));

  return {
    getUser,
    on: lifecycle.on,
    off: lifecycle.off,
    setPresenceProvider,
    setUser,
    store
  }

}