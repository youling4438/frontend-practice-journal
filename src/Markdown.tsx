import { Fragment, type ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const languageAliases: Record<string, string> = {
  angular: "typescript",
  css3: "css",
  html: "xml",
  html5: "xml",
  htm: "xml",
  js: "javascript",
  jsx: "javascript",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "typescript",
  vue: "xml",
};

const plainTextLanguages = new Set(["", "code", "plain", "plaintext", "text", "txt"]);

function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="prose">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const firstBreak = part.indexOf("\n");
          const language = firstBreak > -1
            ? part.slice(3, firstBreak).trim().toLowerCase().split(/\s+/)[0].replace(/[^\w-]/g, "")
            : "";
          const code = firstBreak > -1 ? part.slice(firstBreak + 1, -3).trimEnd() : part.slice(3, -3);
          const highlightLanguage = languageAliases[language] ?? language;
          const highlighted = !plainTextLanguages.has(language) && hljs.getLanguage(highlightLanguage)
            ? hljs.highlight(code, { language: highlightLanguage }).value
            : null;
          return (
            <div className="code-block" key={index}>
              <div>{language || "CODE"}</div>
              <pre>
                {highlighted === null ? (
                  <code>{code}</code>
                ) : (
                  <code
                    className={`hljs language-${highlightLanguage}`}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                )}
              </pre>
            </div>
          );
        }

        return (
          <Fragment key={index}>
            {part.split(/\n\s*\n/).filter((block) => block.trim()).map((block, blockIndex) => {
              const text = block.trim();
              if (/^#{1,6} /.test(text)) return <h3 key={blockIndex}>{inline(text.replace(/^#+ /, ""))}</h3>;
              if (text === "---") return <hr key={blockIndex} />;
              if (text.startsWith(">")) return <blockquote key={blockIndex}>{inline(text.replace(/^> ?/gm, ""))}</blockquote>;
              if (/^[-*] /.test(text)) return <ul key={blockIndex}>{text.split("\n").map((line, lineIndex) => <li key={lineIndex}>{inline(line.replace(/^[-*] /, ""))}</li>)}</ul>;
              return <p key={blockIndex}>{inline(text)}</p>;
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
