import React, { useMemo } from 'react';
import { splitByTerms } from './searchText';

export function Highlighted({ text, terms }) {
  const pieces = useMemo(() => splitByTerms(text || '', terms), [text, terms]);

  return pieces.map((piece, index) => (
    piece.match
      ? <mark key={index} className="bg-transparent text-amber-300 font-semibold">{piece.text}</mark>
      : <React.Fragment key={index}>{piece.text}</React.Fragment>
  ));
}
