// backend/utils/conflictResolver.js
const { createMessage } = require('./openrouter');

/**
 * Resolves conflicts between two agents using an LLM call via OpenRouter
 */
async function resolve({ conflict, agentA, agentB, context = '' }) {
  const prompt = `You are a principal software architect mediating a disagreement between two AI agents.

Conflict description: ${conflict}

Agent A's approach:
${agentA}

Agent B's approach:
${agentB}

${context ? `Additional context:\n${context}` : ''}

Analyze both approaches and provide:
1. The root cause of the conflict
2. Strengths of each approach
3. The recommended resolution (which to use, or a hybrid)
4. Concrete implementation steps to resolve it

Be decisive and technical. Format as JSON:
{
  "rootCause": "...",
  "agentAStrengths": ["..."],
  "agentBStrengths": ["..."],
  "recommendation": "A|B|hybrid",
  "resolution": "...",
  "implementationSteps": ["step1", "step2"]
}`;

  try {
    const response = await createMessage({
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { resolution: text, recommendation: 'hybrid' };
  } catch (err) {
    console.error('Conflict resolution error:', err);
    return {
      resolution: 'Manual review required. Both approaches have merit.',
      recommendation: 'hybrid',
      error: err.message
    };
  }
}

/**
 * Detect conflicts from reviewer output
 */
function detectConflicts(reviewOutput) {
  const conflictKeywords = ['conflict', 'inconsistency', 'mismatch', 'contradiction', 'disagree', 'incompatible'];
  const lower = reviewOutput.toLowerCase();
  return conflictKeywords.some(kw => lower.includes(kw));
}

module.exports = { resolve, detectConflicts };
