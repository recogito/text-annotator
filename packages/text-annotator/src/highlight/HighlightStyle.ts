import type { DrawingStyle } from '@annotorious/core';

export const DEFAULT_STYLE: DrawingStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.18 
};

export const DEFAULT_SELECTED_STYLE: DrawingStyle = { 
  fill: 'rgb(0, 128, 255)', 
  fillOpacity: 0.45 
};

export interface HighlightStyle extends Pick<DrawingStyle, 'fill' | 'fillOpacity'> {

  underlineStyle?: string;

  underlineColor?: number;

  underlineOffset?: number;

  underlineThickness?: number;
  
}