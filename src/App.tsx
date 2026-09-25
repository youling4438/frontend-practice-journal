import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowUpRight, BookOpen, Bookmark, Clock, Code2, Layers3,
  Menu, Plus, Search, X,
} from "lucide-react";
import seed from "./data/lessons.json";
import { Markdown } from "./Markdown";

type Status = "unread" | "review" | "done";
type Lesson = {
  id: string;
  sequence: number;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  date: string | null;
  status: Status;
};
type StoredState = { custom: Lesson[]; statuses: Record<string, Status> };

const STORAGE_KEY = "frontend-journal-state-v1";
const builtIn = seed as Lesson[];
const statusText: Record<Status, string> = { unread: "未标记", review: "待复习", done: "已回顾" };

function readStored(): StoredState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Partial<StoredState>;
    return {
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      statuses: parsed.statuses && typeof parsed.statuses === "object" ? parsed.statuses : {},
    };
  } catch {
    return { custom: [], statuses: {} };
  }
}

function shortSummary(content: string) {
  return content.replace(/[#*`>]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
}

export default function App() {
  const [stored, setStored] = useState<StoredState>(readStored);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("全部");
  const [view, setView] = useState<"all" | "review" | "done">("all");
  const [selected, setSelected] = useState(() => location.hash.slice(1));
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState({ title: "", tags: "", date: "", content: "" });

  const lessons = useMemo(() => [
    ...builtIn.map((lesson) => ({ ...lesson, status: stored.statuses[lesson.id] || lesson.status })),
    ...stored.custom.map((lesson) => ({ ...lesson, status: stored.statuses[lesson.id] || lesson.status })),
  ], [stored]);

  const topics = useMemo(() => [...new Set(lessons.flatMap((lesson) => lesson.tags))], [lessons]);
  const current = lessons.find((lesson) => lesson.id === selected);
  const filtered = useMemo(() => [...lessons]
    .sort((a, b) => b.sequence - a.sequence)
    .filter((lesson) => (view === "all" || lesson.status === view)
      && (topic === "全部" || lesson.tags.includes(topic))
      && `${lesson.title} ${lesson.content} ${lesson.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())),
  [lessons, query, topic, view]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

  useEffect(() => {
    const syncHash = () => setSelected(location.hash.slice(1));
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function selectLesson(id = "") {
    if (id) history.pushState(null, "", `#${id}`);
    else history.pushState(null, "", `${location.pathname}${location.search}`);
    setSelected(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigate(next: "all" | "review" | "done") {
    setView(next);
    setQuery("");
    setTopic("全部");
    selectLesson();
  }

  function mark(id: string, next: Status) {
    setStored((previous) => ({ ...previous, statuses: { ...previous.statuses, [id]: next } }));
    setNotice(next === "review" ? "已加入待复习" : next === "done" ? "已标记为回顾完成" : "已取消标记");
  }

  function saveLesson(event: FormEvent) {
    event.preventDefault();
    const tags = [...new Set(draft.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
    const lesson: Lesson = {
      id: crypto.randomUUID(),
      sequence: Math.max(0, ...lessons.map((item) => item.sequence)) + 1,
      title: draft.title.trim(),
      content: draft.content.trim(),
      tags,
      summary: shortSummary(draft.content),
      date: draft.date || null,
      status: "unread",
    };
    setStored((previous) => ({ ...previous, custom: [...previous.custom, lesson] }));
    setDraft({ title: "", tags: "", date: "", content: "" });
    setComposerOpen(false);
    setNotice("训练已保存在此浏览器");
    selectLesson(lesson.id);
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <a className="brand" href="/" onClick={() => setMobileOpen(false)}>
          <span className="brand-icon"><Code2 size={23} /></span>
          <span>前端研习室<small>FRONTEND JOURNAL</small></span>
        </a>
        <nav>
          <div className="nav-label">学习空间</div>
          <button className={`nav-item ${view === "all" ? "active" : ""}`} onClick={() => navigate("all")}><BookOpen size={18} />训练档案<span>{lessons.length}</span></button>
          <button className={`nav-item ${view === "review" ? "active" : ""}`} onClick={() => navigate("review")}><Bookmark size={18} />待复习<span>{lessons.filter((item) => item.status === "review").length}</span></button>
          <button className={`nav-item ${view === "done" ? "active" : ""}`} onClick={() => navigate("done")}><Clock size={18} />已回顾<span>{lessons.filter((item) => item.status === "done").length}</span></button>
        </nav>
        <div className="sidebar-note"><span>练习，让知识落地。</span><p>把每次实战里的思考，<br />留给下一次遇到问题的自己。</p><div className="schedule">每周一 · 二 · 三 / 20 分钟</div></div>
        <div className="profile"><span>访</span><div>公开知识库<small>个人标记保存在当前浏览器</small></div></div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div><button className="mobile-menu" aria-label="打开导航" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><span>公开空间</span><span className="slash">/</span><b>训练档案</b></div>
          <span className="public-badge"><i />公开阅读</span>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">LEARN. PRACTICE. REVISIT.</div><h1>每一次实战，都有迹可循<span>。</span></h1><p>收藏练习里的思考，在回顾中把知识变成自己的能力。</p></div>
            <button className="primary" onClick={() => setComposerOpen(true)}><Plus size={17} />保存新训练</button>
          </div>

          <div className="stats">
            <div><span className="stat-icon"><BookOpen /></span><div><strong>{lessons.length}<small>篇</small></strong><p>已归档训练</p></div></div>
            <div><span className="stat-icon"><Layers3 /></span><div><strong>{topics.length}<small>个</small></strong><p>技术主题</p></div></div>
            <div><span className="stat-icon"><Clock /></span><div><strong>20<small>分钟 / 次</small></strong><p>保持轻量，持续进步</p></div></div>
            <div className="stat-quote"><span>01 — ∞</span><p>学过的，值得再看一次。</p></div>
          </div>

          {current ? (
            <section className="reading">
              <button className="back" onClick={() => selectLesson()}><ArrowLeft size={16} />返回训练档案</button>
              <div className="tags">{current.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <h2>{current.title}</h2>
              <p className="reading-meta">训练 {String(current.sequence).padStart(2, "0")} · {builtIn.some((item) => item.id === current.id) ? "约 20 分钟 · 公开归档" : `${current.date || "本地归档"} · 仅保存在此浏览器`}</p>
              <div className="reading-actions">
                <button className="secondary" onClick={() => mark(current.id, current.status === "review" ? "unread" : "review")}><Bookmark size={16} />{current.status === "review" ? "取消待复习" : "加入待复习"}</button>
                <button className="secondary" onClick={() => mark(current.id, current.status === "done" ? "unread" : "done")}>{current.status === "done" ? "取消已回顾" : "标记已回顾"}</button>
                <span className="status-chip">{statusText[current.status]}</span>
              </div>
              <Markdown content={current.content} />
            </section>
          ) : (
            <>
              <div className="archive-header">
                <h2>{view === "review" ? "待复习" : view === "done" ? "已回顾" : "训练档案"} <span>{filtered.length}</span></h2>
                <label className="search"><Search size={17} /><input aria-label="搜索训练内容" placeholder="搜索标题、知识点或代码…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button aria-label="清空搜索" onClick={() => setQuery("")}><X size={15} /></button>}</label>
              </div>
              <div className="topic-tabs" role="tablist" aria-label="技术主题">
                {["全部", ...topics].map((tag) => <button role="tab" aria-selected={topic === tag} className={topic === tag ? "active" : ""} key={tag} onClick={() => setTopic(tag)}>{tag}</button>)}
              </div>
              <div className="archive-layout">
                <div className="lesson-list">
                  {filtered.map((lesson) => (
                    <button key={lesson.id} className="lesson-card" onClick={() => selectLesson(lesson.id)}>
                      <div className="lesson-number">{String(lesson.sequence).padStart(2, "0")}</div>
                      <div className="lesson-body">
                        <div className="lesson-top"><div className="tags">{lesson.tags.map((tag) => <span key={tag} className={tag.toLowerCase().replaceAll(" ", "-")}>{tag}</span>)}</div><span className="duration"><Clock size={13} />{builtIn.some((item) => item.id === lesson.id) ? "20 分钟" : "本地训练"}</span></div>
                        <h3>{lesson.title}</h3><p>{lesson.summary}</p>
                        <div className="lesson-bottom"><span>{statusText[lesson.status]} · {builtIn.some((item) => item.id === lesson.id) ? "公开训练归档" : lesson.date || "本地归档"}</span><span>阅读全文 <ArrowUpRight size={14} /></span></div>
                      </div>
                    </button>
                  ))}
                  {!filtered.length && <div className="empty">{view === "review" ? "还没有待复习的训练。在阅读页将值得重温的内容加入这里。" : view === "done" ? "还没有已回顾的训练。读完后可以在阅读页标记。" : "没有找到相关训练，试试其他关键词。"}</div>}
                </div>
                <aside className="review-card"><span className="mini-label">温故知新</span><Bookmark size={26} /><h3>给知识一次<br />再次相遇的机会。</h3><p>遇到值得重温的内容，<br />把它加入待复习列表。</p><div className="review-divider" /><span className="mini-label">你的训练节奏</span><div className="week">{["一", "二", "三", "四", "五", "六", "日"].map((day, index) => <span className={index < 3 ? "on" : ""} key={day}>{day}</span>)}</div><p className="review-foot">小步练习，慢慢积累。</p><button className="secondary" onClick={() => navigate("review")}>查看待复习 · {lessons.filter((item) => item.status === "review").length}</button></aside>
              </div>
            </>
          )}
          <footer className="page-footer"><span>前端研习室</span><span>把实践留存，让成长可见。</span></footer>
        </div>
      </main>

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setComposerOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="composer-title">
            <button className="modal-close" aria-label="关闭" onClick={() => setComposerOpen(false)}><X size={19} /></button>
            <h2 id="composer-title">保存新训练</h2>
            <p>内容仅保存在当前浏览器。支持 Markdown 标题、列表、引用和代码块。</p>
            <form className="dialog-form" onSubmit={saveLesson}>
              <label className="form-field">训练标题<input required maxLength={140} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：Angular Signals 与条件查询" /></label>
              <div className="form-row">
                <label className="form-field">技术主题<input required value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Angular, TypeScript" /><small>用逗号分隔，最多 8 个</small></label>
                <label className="form-field">训练日期（可选）<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
              </div>
              <label className="form-field">训练正文<textarea required maxLength={100000} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="粘贴概念题、代码、答案解析…" /></label>
              <div className="dialog-actions"><button type="button" className="secondary" onClick={() => setComposerOpen(false)}>稍后继续</button><button className="primary" type="submit">保存到浏览器</button></div>
            </form>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
