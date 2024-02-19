export * from './tei';
export * from './TextAnnotator';
export * from './TextAnnotatorPopup';

// Re-export essential Types for convenience
export type { 
  TextAnnotation,
  TextAnnotator as RecogitoTextAnnotator
} from '@recogito/text-annotator';
