import type { W3CTextAnnotation } from '../../../src/model/w3c';

export const correctTextAnnotation: W3CTextAnnotation = {
  '@context': 'http://www.w3.org/ns/anno.jsonld',
  type: 'Annotation',
  id: 'http://www.example.com/annotation/ccf99248-e2a0-4fea-9869-46da99390a9b',
  body: {
    type: 'TextualBody',
    value: 'A comment about a content'
  },
  target: {
    source: 'http://www.example.com/source/1',
    selector: [
      {
        type: 'TextQuoteSelector',
        exact: 'But as years',
        prefix: 'arry him. ',
        suffix: 'went by, '
      },
      {
        type: 'TextPositionSelector',
        start: 922,
        end: 934
      },
    ]
  }
};

export const textAnnotations: W3CTextAnnotation[] = [
  correctTextAnnotation
];
