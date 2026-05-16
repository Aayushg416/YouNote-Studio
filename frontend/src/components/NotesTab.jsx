import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import {
  Copy, Download, RefreshCw, Sparkles
} from 'lucide-react';

const preprocessLaTeX = (content) => {
  if (!content) return '';
  return content
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
};

const NotesTab = ({ notes, generating, setActiveTab, setNotes, videoInfo, handleAskAI, chatInput, setChatInput, chatHistory, setChatHistory, setGenerating }) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(notes);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([notes], { type: 'text/markdown' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = `YouNote_${videoInfo?.videoId || 'notes'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      {notes && (
        <div className="flex gap-1">
          <button
            onClick={copyToClipboard}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            title="Copy Markdown"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={downloadMarkdown}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {generating && !notes ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-white/5 rounded-lg w-1/3"></div>
            <div className="h-20 bg-white/5 rounded-lg"></div>
            <div className="h-6 bg-white/5 rounded-lg w-1/2"></div>
            <div className="h-32 bg-white/5 rounded-lg"></div>
          </div>
        ) : notes ? (
          <div className="text-zinc-200 markdown-body leading-relaxed text-[15px]">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
              h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white border-b border-white/5 pb-2 mt-6 mb-3 flex items-center gap-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-zinc-100 mt-4 mb-2" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-2 text-zinc-300" {...props} />,
              li: ({node, ...props}) => <li className="marker:text-red-500" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-zinc-300" {...props} />,
              code: ({node, ...props}) => <code className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 font-mono text-sm text-orange-300" {...props} />,
              p: ({node, ...props}) => <p className="my-3 text-zinc-300" {...props} />,
              math: ({node, ...props}) => {
                try {
                  return (
                    <div className="math-block">
                      <span className="katex" dangerouslySetInnerHTML={{__html: katex.renderToString(node.value, {displayMode: true})}} />
                    </div>
                  );
                } catch (error) {
                  console.warn('KaTeX rendering error (display):', error, node.value);
                  return (
                    <div className="math-block text-zinc-400 italic">
                      {node.value}
                    </div>
                  );
                }
              },
              inlineMath: ({node, ...props}) => {
                try {
                  return (
                    <span className="katex-inline">
                      <span className="katex" dangerouslySetInnerHTML={{__html: katex.renderToString(node.value, {displayMode: false})}} />
                    </span>
                  );
                } catch (error) {
                  console.warn('KaTeX rendering error (inline):', error, node.value);
                  return (
                    <span className="text-zinc-400 italic">
                      {node.value}
                    </span>
                  );
                }
              }
            }}>
              {preprocessLaTeX(notes)}
            </ReactMarkdown>
            {generating && (
              <div className="flex items-center gap-2 text-xs text-red-400 mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating notes...
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500 text-sm gap-3 font-light">
            <Sparkles className="w-8 h-8 text-zinc-600" />
            <p>Notes will appear here once you explain a video.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default NotesTab;