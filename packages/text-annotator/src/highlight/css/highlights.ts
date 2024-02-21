import type { DrawingStyle } from '@annotorious/core';
import { colord } from 'colord';
import type { TextAnnotation } from '../../model';
import type { HighlightPainter } from '../HighlightPainter';
import type { AnnotationRects } from 'src/state';
import type { ViewportBounds } from '../viewport';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE } from '../HighlightStyle';

const toCSS = (s: DrawingStyle) => {
  const backgroundColor = colord(s.fill || DEFAULT_STYLE.fill).alpha(s.fillOpacity || DEFAULT_STYLE.fillOpacity).toHex();
  return `background-color: ${backgroundColor};`
}

// const setsEqual = (set1: Set<any>, set2: Set<any>) =>
//   set1.size === set2.size && [...set1].every(value => set2.has(value));

export const createHighlights = () => {
  const elem = document.createElement('style');
  document.getElementsByTagName('head')[0].appendChild(elem);

  let customPainter: HighlightPainter;

  let currentRendered = new Set<string>();

  const refresh = (
    highlights: AnnotationRects[], 
    viewportBounds: ViewportBounds,
    selected: string[], 
    currentStyle: DrawingStyle | ((annotation: TextAnnotation, selected: boolean) => DrawingStyle)
  ) => {
    if (customPainter)
      customPainter.clear();

    // Next set of rendered annotation IDs and selections
    const nextRendered = new Set(highlights.map(h => h.annotation.id));
    const nextSelected = new Set(selected);

    // Annotations currently in this stylesheet that no longer need rendering
    const toRemove = Array.from(currentRendered).filter(id => !nextRendered.has(id));

    // For simplicity, re-generate the whole stylesheet
    const updatedCSS = highlights.map(h => {
      const isSelected = nextSelected.has(h.annotation.id);

      const base = currentStyle 
        ? typeof currentStyle === 'function' 
          ? currentStyle(h.annotation, isSelected) 
          : currentStyle 
        : isSelected ? DEFAULT_SELECTED_STYLE : DEFAULT_STYLE;

      // Trigger the custom painter (if any) as a side-effect
      const style = customPainter ? customPainter.paint(h, viewportBounds, isSelected) || base : base;

      return `::highlight(_${h.annotation.id}) { ${toCSS(style)} }`;
    });

    elem.innerHTML = updatedCSS.join('\n');

    // After we have the styles, we need to update the Highlights.
    // Note that the (experimental) CSS Custom Highlight API is not yet
    // available in TypeScript!

    // @ts-ignore
    toRemove.forEach(id => CSS.highlights.delete(`_${id}`));

    // Could be improved further by (re-)setting only annotations that
    // have changes.
    highlights.forEach(({ annotation }) => { 
      const ranges = annotation.target.selector.map(s => s.range);

      // @ts-ignore
      const highlights = new Highlight(...ranges);

      // @ts-ignore
      CSS.highlights.set(`_${annotation.id}`, highlights);
    });

    currentRendered = nextRendered;
  }

  const setPainter = (painter: HighlightPainter) => customPainter = painter;

  const destroy = () => {
    // Clear all highlights from the Highlight Registry
    // @ts-ignore
    CSS.highlights.clear();

    // Remove the stylesheet
    elem.remove();
  }

  return {
    destroy,
    refresh,
    setPainter
  }

}