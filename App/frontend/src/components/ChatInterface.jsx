import React, { useState, useRef, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';

/**
 * ChatInterface — AI Insights chat, restyled to match Stitch design:
 *  - Light background
 *  - AI bubble: white card, left-aligned
 *  - User bubble: teal-filled, right-aligned
 *  - Quick prompt chips as pill buttons
 *  - Date divider
 */

const QUICK_PROMPTS = [
  {
    id: 'mergeable',
    label: 'Show mergeable schools',
    description: 'Which schools can be closed and merged?',
    filter: recs => recs.filter(r => r.type === 'merge'),
    reply: (filtered) =>
      `I found **${filtered.length} schools** that are candidates for closure and merger. These are zero-enrollment schools matched to the nearest compatible school within RTE distance limits.`,
  },
  {
    id: 'teachers',
    label: 'Redistribute surplus staff',
    description: 'Which schools are critically understaffed?',
    filter: recs => recs.filter(r => r.type === 'redistribute'),
    reply: (filtered) =>
      `There are **${filtered.length} teacher redistribution** opportunities identified. These schools have high enrollment but critically low teacher counts, eligible for redeployment.`,
  },
  {
    id: 'rte_issues',
    label: 'Download compliance audit',
    description: 'Which recommendations exceed distance limits?',
    filter: recs => recs.filter(r => !r.rte_compliant),
    reply: (filtered) =>
      filtered.length === 0
        ? `Great news — **all recommendations are RTE-compliant!** Every proposed merge is within the prescribed distance limit (1km for primary, 3km for upper-primary).`
        : `Found **${filtered.length} recommendation(s)** that exceed RTE distance limits. These may require additional transport provisions or infrastructure review.`,
  },
  {
    id: 'summary',
    label: 'Full resource summary',
    description: 'Give me a complete overview of all actions needed',
    filter: recs => recs,
    reply: (filtered) => {
      const merges = filtered.filter(r => r.type === 'merge').length;
      const redist = filtered.filter(r => r.type === 'redistribute').length;
      const compliant = filtered.filter(r => r.rte_compliant).length;
      return `Here's the complete rationalization summary for this constituency:\n\n• **${merges}** school merges recommended\n• **${redist}** teacher redistributions needed\n• **${compliant}** of ${filtered.length} recommendations are fully RTE-compliant\n\nAll recommendations are based on haversine distance and RTE Act thresholds (1km primary / 3km upper-primary).`;
    },
  },
];

const TYPING_DELAY_MS = 900;

// Get today's date in a readable format
const TODAY_LABEL = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

function parseMarkdown(text) {
  return text
    .split('\n')
    .map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} style={{ color: 'var(--primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
}

export default function ChatInterface({ 
  recommendations, 
  districtName, 
  preloadedRecommendation,
  messages,
  setMessages,
  usedPrompts,
  setUsedPrompts
}) {
  const districtLabel = districtName || 'this constituency';
  const [isTyping, setIsTyping]       = useState(false);
  const [inputText, setInputText]     = useState('');
  const endRef                        = useRef(null);

  // Handle preloaded recommendation
  useEffect(() => {
    if (preloadedRecommendation && !messages.some(m => m.id === 'preloaded')) {
      const assistantMsg = {
        id: 'preloaded',
        role: 'assistant',
        type: 'cards',
        content: `Here is the priority recommendation you selected from the dashboard:`,
        cards: [preloadedRecommendation],
        time: formatTime(new Date()),
      };
      setMessages(prev => [...prev, assistantMsg]);
    }
  }, [preloadedRecommendation, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handlePrompt = (prompt) => {
    if (isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      content: prompt.description,
      time: formatTime(new Date()),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setUsedPrompts(prev => new Set([...prev, prompt.id]));

    setTimeout(() => {
      const filtered = prompt.filter(recommendations || []);
      const replyText = prompt.reply(filtered);

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        type: 'cards',
        content: replyText,
        cards: filtered,
        time: formatTime(new Date()),
      };

      setIsTyping(false);
      setMessages(prev => [...prev, assistantMsg]);
    }, TYPING_DELAY_MS);
  };

  const handleSubmitText = () => {
    if (!inputText.trim() || isTyping) return;
    
    const text = inputText.trim();
    setInputText('');

    const { filtered, replyText } = getSimulatedResponse(text, recommendations || []);

    const customPrompt = {
      id: `custom-${Date.now()}`,
      description: text,
      filter: () => filtered,
      reply: () => replyText
    };

    handlePrompt(customPrompt);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)' }}>

      {/* Chat thread */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Date divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--on-surface-variant)',
            background: 'var(--surface-container)',
            padding: '3px 12px',
            borderRadius: 'var(--radius-full)',
          }}>
            {TODAY_LABEL}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--outline-variant)' }} />
        </div>

        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            {/* AI Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div style={{
              background: 'var(--surface-container-lowest)',
              border: '1px solid var(--outline-variant)',
              borderRadius: '0 12px 12px 12px',
              padding: '12px 16px',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick prompt chips */}
      <div style={{
        borderTop: '1px solid var(--outline-variant)',
        padding: '14px 32px',
        background: 'var(--surface-container-lowest)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePrompt(p)}
              disabled={isTyping}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${usedPrompts.has(p.id) ? 'var(--secondary)' : 'var(--outline-variant)'}`,
                background: usedPrompts.has(p.id) ? 'var(--secondary-container)' : 'var(--surface-container-lowest)',
                color: usedPrompts.has(p.id) ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: isTyping ? 'not-allowed' : 'pointer',
                opacity: isTyping ? 0.5 : 1,
                transition: 'all var(--transition-fast)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                if (!isTyping && !usedPrompts.has(p.id)) {
                  e.currentTarget.style.borderColor = 'var(--secondary)';
                  e.currentTarget.style.color = 'var(--secondary)';
                }
              }}
              onMouseLeave={e => {
                if (!usedPrompts.has(p.id)) {
                  e.currentTarget.style.borderColor = 'var(--outline-variant)';
                  e.currentTarget.style.color = 'var(--on-surface-variant)';
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}>attach_file</span>
          <input
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              color: 'var(--on-surface)',
            }}
            placeholder="Ask SchoolSync AI anything about educational data..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmitText();
              }
            }}
            disabled={isTyping}
          />
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}>mic</span>
          <button
            onClick={handleSubmitText}
            disabled={isTyping || !inputText.trim()}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: (isTyping || !inputText.trim()) ? 'var(--surface-container)' : 'var(--secondary)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: (isTyping || !inputText.trim()) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              boxShadow: (isTyping || !inputText.trim()) ? 'none' : '0 2px 8px rgba(0, 106, 97, 0.3)',
              transition: 'transform var(--transition-fast), background var(--transition-fast)',
            }}
            onMouseEnter={e => {
              if (!isTyping && inputText.trim()) e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              if (!isTyping && inputText.trim()) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white' }}>send</span>
          </button>
        </div>

        {/* Footer note */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
            Privacy Policy &amp; Data Security Active
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7 }}>
            Ministry of Education — Governance Portal
          </span>
        </div>
      </div>
    </div>
  );
}

function getSimulatedResponse(userInput, recommendationsData) {
  const text = userInput.toLowerCase();
  
  if (text.includes('merge') || text.includes('close') || text.includes('zero-enrollment')) {
    const filtered = recommendationsData.filter(r => r.type === 'merge');
    return {
      filtered,
      replyText: `I found **${filtered.length} schools** that are candidates for closure and merger based on your query.`
    };
  }
  
  if (text.includes('teacher') || text.includes('staff') || text.includes('redistribute') || text.includes('single-teacher')) {
    const filtered = recommendationsData.filter(r => r.type === 'redistribute');
    return {
      filtered,
      replyText: `There are **${filtered.length} teacher redistribution** opportunities relevant to your request.`
    };
  }

  if (text.includes('distance') || text.includes('rte') || text.includes('compliant') || text.includes('limit')) {
    const filtered = recommendationsData.filter(r => !r.rte_compliant);
    return {
      filtered,
      replyText: filtered.length === 0
        ? `Great news — **all recommendations are RTE-compliant!**`
        : `Found **${filtered.length} recommendation(s)** that exceed RTE distance limits.`
    };
  }

  return {
    filtered: [],
    replyText: "I can help with merge recommendations or teacher redistribution — try one of the quick prompts above, or ask specifically about 'merges' or 'teachers'."
  };
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function ChatMessage({ msg }) {
  const isAssistant = msg.role === 'assistant';

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        gap: 12,
        flexDirection: isAssistant ? 'row' : 'row-reverse',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      {isAssistant ? (
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
          fontWeight: 700, fontSize: 14, color: 'var(--on-primary-container)',
        }}>
          D
        </div>
      )}

      {/* Message area */}
      <div style={{ maxWidth: 'min(85%, 660px)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Bubble */}
        <div style={{
          background: isAssistant ? 'var(--surface-container-lowest)' : 'var(--secondary)',
          border: isAssistant ? '1px solid var(--outline-variant)' : 'none',
          borderRadius: isAssistant ? '0 12px 12px 12px' : '12px 0 12px 12px',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: isAssistant ? 'var(--on-surface-variant)' : 'var(--on-secondary)',
          lineHeight: 1.6,
          boxShadow: isAssistant ? 'var(--shadow-sm)' : 'none',
        }}>
          {/* RTE compliance badges for AI responses with cards */}
          {isAssistant && msg.type === 'cards' && msg.cards && msg.cards.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {msg.cards.some(c => c.rte_compliant) && (
                <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>✓ RTE Compliant</span>
              )}
              {msg.cards.some(c => !c.rte_compliant) && (
                <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>⚠ Needs Review</span>
              )}
            </div>
          )}
          {parseMarkdown(msg.content)}
        </div>

        {/* Recommendation cards inline */}
        {msg.cards && msg.cards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msg.cards.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} compact />
            ))}
          </div>
        )}

        {/* No results */}
        {msg.cards && msg.cards.length === 0 && msg.type === 'cards' && (
          <div style={{
            background: 'var(--surface-container-low)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            fontSize: '0.85rem',
            color: 'var(--on-surface-variant)',
            textAlign: 'center',
          }}>
            ✓ No issues found in this category
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', opacity: 0.6, textAlign: isAssistant ? 'left' : 'right' }}>
          {msg.time}
        </div>
      </div>
    </div>
  );
}
