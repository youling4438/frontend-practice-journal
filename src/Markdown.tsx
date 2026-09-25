import { Fragment, type ReactNode } from "react";

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
          const language = firstBreak > -1 ? part.slice(3, firstBreak) : "CODE";
          const code = firstBreak > -1 ? part.slice(firstBreak + 1, -3).trimEnd() : part.slice(3, -3);
          return (
            <div className="code-block" key={index}>
              <div>{language || "CODE"}</div>
              <pre><code>{code}</code></pre>
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
