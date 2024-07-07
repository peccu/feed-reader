import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

interface DynamicSyntaxHighlighterProps {
  children: React.ReactNode;
}

const DynamicSyntaxHighlighter: React.FC<DynamicSyntaxHighlighterProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const codeBlocks = containerRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [children]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

export default DynamicSyntaxHighlighter;