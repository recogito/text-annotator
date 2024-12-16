import debounce from 'debounce';

import type { ViewportState } from '@annotorious/core';

import type { TextAnnotatorState } from '../../state';
import type { ViewportBounds } from '../viewport';
import type { HighlightStyle } from '../HighlightStyle';
import { DEFAULT_SELECTED_STYLE, DEFAULT_STYLE, type HighlightStyleExpression } from '../HighlightStyle';
import type { HighlightPainter } from '../HighlightPainter';
import { createBaseRenderer, type RendererImplementation } from '../baseRenderer';
import type { Highlight } from '../Highlight';
import type { TextAnnotation } from 'src/model';

import './canvasRenderer.css';

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.className = 'r6o-canvas-highlight-layer bg';
  return canvas;
}

const resetCanvas = (canvas: HTMLCanvasElement, highres?: boolean) => {
  canvas.width = highres ? 2 * window.innerWidth : window.innerWidth;
  canvas.height = highres ? 2 * window.innerHeight : window.innerHeight;

  if (highres) {
    // Note that resizing the canvas resets the context
    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.translate(0.5, 0.5);
  }
}

const createRenderer = (container: HTMLElement): RendererImplementation => {

  container.classList.add('r6o-annotatable');

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  document.body.appendChild(canvas);

  const redraw = (
    highlights: Highlight[],
    viewportBounds: ViewportBounds,
    currentStyle?: HighlightStyleExpression,
    currentPainter?: HighlightPainter
  ) => requestAnimationFrame(() => {

    const { width, height } = canvas;

    // New render loop - clear canvases
    ctx.clearRect(-0.5, -0.5, width + 1, height + 1);

    if (currentPainter)
      currentPainter.clear();

    const { top, left } = viewportBounds;

    /**
     * Highlights rendering on the canvas is an order-sensitive operation.
     * The later the highlight is rendered, the higher it will be in the visual stack.
     *
     * By default, we should expect that the newer highlight
     * will be rendered over the older one
     */
    const highlightsByCreation = [...highlights].sort((highlightA, highlightB) => {
      const { annotation: { target: { created: createdA } } } = highlightA;
      const { annotation: { target: { created: createdB } } } = highlightB;
      return createdA.getTime() - createdB.getTime();
    });

    highlightsByCreation.forEach(h => {
      const base: HighlightStyle = currentStyle
        ? typeof currentStyle === 'function'
          ? currentStyle(h.annotation, h.state)
          : currentStyle
        : h.state?.selected
          ? DEFAULT_SELECTED_STYLE
          : DEFAULT_STYLE;

      // Trigger the custom painter (if any) as a side-effect
      const style = currentPainter ? currentPainter.paint(h, viewportBounds) || base : base;

      // Offset annotation rects by current scroll position
      const offsetRects = h.rects.map(({ x, y, width, height }) => ({
        x: x + left,
        y: y + top,
        width,
        height
      }));

      ctx.fillStyle = style.fill;
      ctx.globalAlpha = style.fillOpacity || 1;

      offsetRects.forEach(({ x, y, width, height }) =>
        ctx.fillRect(x, y, width, height)
      );

      if (style.underlineColor) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = style.underlineColor;
        ctx.lineWidth = style.underlineThickness ?? 1;

        // Place the underline below the highlighted text + an optional offset
        const underlineOffset = style.underlineOffset ?? 0;

        offsetRects.forEach(({ x, y, width, height }) => {
          ctx.beginPath();
          ctx.moveTo(x, y + height + underlineOffset);
          ctx.lineTo(x + width, y + height + underlineOffset);

          // Draw the Path
          ctx.stroke();
        });
      }
    });
  });

  const onResize = debounce(() => resetCanvas(canvas), 10);

  window.addEventListener('resize', onResize);

  const setVisible = (visible: boolean) => {
    console.log('setVisible not implemented on Canvas renderer');
  }

  const destroy = () => {
    canvas.remove();

    onResize.clear();
    window.removeEventListener('resize', onResize);
  }

  return {
    destroy,
    setVisible,
    redraw
  };

};

export const createCanvasRenderer = (
  container: HTMLElement,
  state: TextAnnotatorState<TextAnnotation, unknown>,
  viewport: ViewportState
) => createBaseRenderer(container, state, viewport, createRenderer(container));
