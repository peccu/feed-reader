import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import React, { useEffect, useRef } from "react";

interface DynamicSyntaxHighlighterProps {
  children: React.ReactNode;
}

const DynamicSyntaxHighlighter: React.FC<DynamicSyntaxHighlighterProps> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const codeBlocks = containerRef.current.querySelectorAll(
        "pre code",
      ) as NodeListOf<HTMLPreElement>;
      codeBlocks.forEach((block) => {
        if (block.dataset.highlighted == "yes") {
          return;
        }
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [children]);

  return <div ref={containerRef}>{children}</div>;
};

export default DynamicSyntaxHighlighter;
