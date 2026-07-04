import React, { useState, useRef, useEffect } from 'react';
import RecommendationCard from './RecommendationCard';

/**
 * ChatInterface — AI Insights tab simulating an LLM chat experience.
 * No real API call — quick prompts are mapped to filtered recommendations.
 *
 * For a production version, replace the simulate() function with a real
 * call to Gemini / GPT-4 with recommendations as context.
 */

const QUICK_PROMPTS = [
  {
    id: 'mergeable',
    label: '🔀 Show mergeable schools',
    description: 'Which schools can be closed and merged?',
    filter: recs => recs.filter(r => r.type === 'merge'),
    reply: (filtered) =>
      `I found **${filtered.length} schools** that are candidates for closure and merger. These are zero-enrollment schools that have been matched to the nearest compatible school within RTE distance limits.`,
  },
  {
    id: 'teachers',
    label: '👤 Schools needing teachers',
    description: 'Which schools are critically understaffed?',
    filter: recs => recs.filter(r => r.type === 'redistribute'),
    reply: (filtered) =>
      `There are **${filtered.length} teacher redistribution** opportunities identified. These schools have high enrollment but critically low teacher counts, making them eligible for redeployment from merged schools.`,
  },
  {
    id: 'rte_issues',
    label: '⚠ RTE compliance issues',
    description: 'Which recommendations exceed distance limits?',
    filter: recs => recs.filter(r => !r.rte_compliant),
    reply: (filtered) =>
      filtered.length === 0
        ? `Great news — **all recommendations are RTE-compliant!** Every proposed merge is within the prescribed distance limit (1km for primary, 3km for upper-primary).`
        : `Found **${filtered.length} recommendation(s)** that exceed RTE distance limits. These still represent the nearest available school, but may require additional transport provisions or infrastructure review.`,
  },
  {
    id: 'summary',
    label: '📊 Full resource summary',
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

function parseMarkdown(text) {
  // Simple inline markdown: **bold**
  return text
    .split('\n')
    .map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j} style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
}

export default function ChatInterface({ recommendations }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      type: 'text',
      content: "👋 Hi! I'm the **SchoolSync AI**. I can analyze school data for this constituency and surface actionable recommendations. Use the quick prompts below or ask me anything about school resources.",
      cards: [],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState(new Set());
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handlePrompt = (prompt) => {
    if (isTyping) return;

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      type: 'text',
      content: prompt.description,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setUsedPrompts(prev => new Set([...prev, prompt.id]));

    // Simulate AI thinking delay
    setTimeout(() => {
      const filtered = prompt.filter(recommendations || []);
      const replyText = prompt.reply(filtered);

      const assistantMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        type: 'cards',
        content: replyText,
        cards: filtered,
      };

      setIsTyping(false);
      setMessages(prev => [...prev, assistantMsg]);
    }, TYPING_DELAY_MS);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* Chat thread */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {messages.map(msg => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}>
              ✦
            </div>
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '0 16px 16px 16px',
              padding: '12px 16px',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick prompt buttons */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: '16px 24px',
        background: 'var(--color-bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 12,
        }}>
          Quick Insights
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p.id}
              onClick={() => handlePrompt(p)}
              disabled={isTyping}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${usedPrompts.has(p.id) ? 'rgba(129, 140, 248, 0.4)' : 'var(--color-border)'}`,
                background: usedPrompts.has(p.id) ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: usedPrompts.has(p.id) ? 'var(--color-indigo-400)' : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: isTyping ? 'not-allowed' : 'pointer',
                opacity: isTyping ? 0.5 : 1,
                transition: 'all var(--transition-normal)',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                if (!isTyping) {
                  e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.5)';
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.color = 'var(--color-indigo-400)';
                }
              }}
              onMouseLeave={e => {
                if (!usedPrompts.has(p.id)) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: isAssistant
          ? 'linear-gradient(135deg, #6366f1, #818cf8)'
          : 'linear-gradient(135deg, #374151, #4b5563)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        flexShrink: 0,
        marginTop: 2,
      }}>
        {isAssistant ? '✦' : '👤'}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: 'min(90%, 640px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Text */}
        <div style={{
          background: isAssistant ? 'var(--color-bg-card)' : 'rgba(99, 102, 241, 0.15)',
          border: `1px solid ${isAssistant ? 'var(--color-border)' : 'rgba(129, 140, 248, 0.3)'}`,
          borderRadius: isAssistant ? '0 16px 16px 16px' : '16px 0 16px 16px',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          {parseMarkdown(msg.content)}
        </div>

        {/* Recommendation cards */}
        {msg.cards && msg.cards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msg.cards.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} compact />
            ))}
          </div>
        )}

        {/* No results case */}
        {msg.cards && msg.cards.length === 0 && msg.type === 'cards' && (
          <div style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}>
            ✓ No issues found in this category
          </div>
        )}
      </div>
    </div>
  );
}
