import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Brain, Sparkles, RefreshCw, Send
} from 'lucide-react';

const preprocessLaTeX = (content) => {
  if (!content) return '';
  return content
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
};

const ChatTab = ({ videoInfo, generating, chatInput, setChatInput, chatHistory, setChatHistory, handleAskAI, setGenerating }) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleAskAI(e);
  };

  return (
    <>
    <div className="flex flex-col flex-1 min-h-0 p-6">
        <div className="flex-1 space-y-4 mb-4 overflow-y-auto text-[14px]">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-zinc-300 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <p className="leading-relaxed">Ask me anything about the loaded video! I can clarify confusing parts, explain definitions, or drill down deeper into specific timestamps.</p>
          </div>

          {chatHistory.map((chat, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${chat.role === 'user' ? 'bg-white/[0.02] border-white/5 self-end ml-12' : 'bg-red-950/10 border-red-900/20'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${chat.role === 'user' ? 'bg-zinc-700 text-zinc-200' : 'bg-red-500 text-white'}`}>
                  {chat.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="text-zinc-200 prose-sm w-full overflow-x-hidden">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{preprocessLaTeX(chat.content)}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={generating || !videoInfo}
            placeholder={!videoInfo ? "Extract a video first..." : "Type your question here..."}
            className="w-full glass-input pl-4 pr-12 py-3.5 text-sm placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={generating || !videoInfo || !chatInput.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-zinc-800 hover:bg-white transition-all hover:text-black text-white rounded-xl disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:hover:text-white"
          >
            {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatTab;