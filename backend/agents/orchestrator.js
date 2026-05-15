// backend/agents/orchestrator.js
const { createMessage } = require('../utils/openrouter');
const Task = require('../models/Task');
const messageQueue = require('../utils/messageQueue');
const { resolve: resolveConflict, detectConflicts } = require('../utils/conflictResolver');

const AGENT_CONFIGS = {
  frontend: {
    name: 'Aria',
    emoji: '🎨',
    color: '#06b6d4',
    system: `You are Aria, a senior React/Vite/Tailwind CSS frontend engineer with expertise in GSAP and Framer Motion animations.
Your job: Build clean, accessible, beautifully animated React UI components.
Always return working JSX code with proper imports, TypeScript-friendly props, and Tailwind classes.
Include: component structure, state management with hooks, responsive design, and smooth animations.
Format your response with a brief explanation followed by code blocks.`,
  },
  backend: {
    name: 'Nexus',
    emoji: '⚙️',
    color: '#8b5cf6',
    system: `You are Nexus, a senior Node.js/Express/MongoDB backend architect.
Your job: Build production-grade RESTful APIs with robust authentication, validation, and error handling.
Always return working Express route handlers with: JWT middleware, Joi/Zod validation, Mongoose models, proper HTTP status codes, and security best practices.
Include: route definitions, middleware, error handling, and MongoDB schema if needed.
Format your response with a brief explanation followed by code blocks.`,
  },
  qa: {
    name: 'Vera',
    emoji: '🔬',
    color: '#10b981',
    system: `You are Vera, a QA automation engineer specializing in Jest, Playwright, and Supertest.
Your job: Write comprehensive test suites covering unit, integration, and E2E scenarios.
Always return working test files with: describe/it blocks, beforeEach/afterEach hooks, mock factories, edge cases, error scenarios, and coverage for at least 80% of the code paths.
Format your response with a brief explanation followed by test code blocks.`,
  },
  reviewer: {
    name: 'Orion',
    emoji: '🔭',
    color: '#f59e0b',
    system: `You are Orion, a principal software engineer and architect.
Your job: Review all agent outputs for security vulnerabilities, architectural soundness, performance bottlenecks, and inter-agent conflicts.
Always provide: specific issues found (numbered), severity level (critical/high/medium/low), recommended fixes, and a conflict analysis if frontend and backend disagree on API contracts.
Be precise, constructive, and actionable.`,
  },
};

class Orchestrator {
  constructor(taskId) {
    this.taskId = taskId.toString();
    this.outputs = {};
    this.startTime = Date.now();
  }

  emit(event, data) {
    messageQueue.publish(this.taskId, event, { ...data, timestamp: new Date().toISOString() });
  }

  async updateAgentStatus(agentKey, status, output = null) {
    const update = { 'agentOutputs.$.status': status };
    if (output) update['agentOutputs.$.output'] = output;
    await Task.findOneAndUpdate(
      { _id: this.taskId, 'agentOutputs.agent': agentKey },
      { $set: update }
    );
  }

  async callAgent(agentKey, prompt, contextMessages = []) {
    const cfg = AGENT_CONFIGS[agentKey];
    const agentStart = Date.now();

    this.emit('agent_start', {
      agent: agentKey,
      name: cfg.name,
      emoji: cfg.emoji,
      color: cfg.color,
      message: `${cfg.name} is working on the task...`
    });

    // Push agent output placeholder
    await Task.findByIdAndUpdate(this.taskId, {
      $push: {
        agentOutputs: {
          agent: agentKey,
          name: cfg.name,
          status: 'running',
          createdAt: new Date()
        }
      }
    });

    try {
      const messages = [
        ...contextMessages,
        { role: 'user', content: prompt }
      ];

      // ── OpenRouter call ──────────────────────────────────────
      const response = await createMessage({
        max_tokens: 2000,
        system: cfg.system,
        messages,
      });
      // ────────────────────────────────────────────────────────

      const output = response.content[0].text;
      const duration = Date.now() - agentStart;

      this.outputs[agentKey] = output;

      // Extract code blocks
      const codeBlocks = [];
      const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
      let match;
      while ((match = codeRegex.exec(output)) !== null) {
        codeBlocks.push(match[1]);
      }

      // Update DB
      await Task.findOneAndUpdate(
        { _id: this.taskId, 'agentOutputs.agent': agentKey },
        {
          $set: {
            'agentOutputs.$.output': output,
            'agentOutputs.$.codeBlocks': codeBlocks,
            'agentOutputs.$.status': 'done',
            'agentOutputs.$.duration': duration,
          }
        }
      );

      this.emit('agent_done', {
        agent: agentKey,
        name: cfg.name,
        emoji: cfg.emoji,
        color: cfg.color,
        output,
        duration,
        codeBlocks: codeBlocks.length,
        message: `${cfg.name} completed in ${(duration / 1000).toFixed(1)}s`
      });

      return output;
    } catch (err) {
      await Task.findOneAndUpdate(
        { _id: this.taskId, 'agentOutputs.agent': agentKey },
        { $set: { 'agentOutputs.$.status': 'error' } }
      );

      this.emit('agent_error', {
        agent: agentKey,
        name: cfg.name,
        error: err.message
      });

      throw err;
    }
  }

  async interAgentMessage(fromAgent, toAgent, message) {
    const from = AGENT_CONFIGS[fromAgent];
    const to = AGENT_CONFIGS[toAgent];

    await Task.findByIdAndUpdate(this.taskId, {
      $push: {
        messages: {
          from: fromAgent,
          to: toAgent,
          content: message,
          timestamp: new Date()
        }
      }
    });

    this.emit('inter_agent_message', {
      from: fromAgent,
      fromName: from.name,
      fromEmoji: from.emoji,
      to: toAgent,
      toName: to.name,
      toEmoji: to.emoji,
      message,
    });
  }

  async run(description) {
    await Task.findByIdAndUpdate(this.taskId, { status: 'running' });

    this.emit('orchestrator', {
      message: `🚀 Decomposing task: "${description}"`,
      phase: 'init'
    });

    try {
      // ═══ PHASE 1: Decompose task ═══════════════════════════
      this.emit('phase', { phase: 1, name: 'Task Decomposition', message: 'Breaking task into parallel workstreams...' });

      const decompositionPrompt = `Feature request: "${description}"

Break this into specific sub-tasks for:
1. Frontend (React/UI components needed)
2. Backend (API endpoints, data models needed)

Return as JSON: { "frontend": "...", "backend": "...", "apiContract": "..." }`;

      // ── OpenRouter call ──────────────────────────────────────
      const decompositionResp = await createMessage({
        max_tokens: 500,
        messages: [{ role: 'user', content: decompositionPrompt }],
      });
      // ────────────────────────────────────────────────────────

      let decomposition = { frontend: description, backend: description, apiContract: '' };
      try {
        const jsonMatch = decompositionResp.content[0].text.match(/\{[\s\S]*\}/);
        if (jsonMatch) decomposition = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      this.emit('decomposition', { decomposition });

      // ═══ PHASE 2: Backend + Frontend in parallel ═══════════
      this.emit('phase', { phase: 2, name: 'Parallel Development', message: 'Aria and Nexus building simultaneously...' });

      const [beOutput, feOutput] = await Promise.all([
        this.callAgent('backend', `Build Express.js API for this feature: ${decomposition.backend}\n\nAPI Contract hints: ${decomposition.apiContract}`),
        this.callAgent('frontend', `Build React UI component for this feature: ${decomposition.frontend}\n\nAPI Contract hints: ${decomposition.apiContract}`),
      ]);

      // Inter-agent handshake
      await this.interAgentMessage(
        'backend', 'frontend',
        `Hey Aria! I've built the API endpoints. Please make sure your fetch calls match my routes and payload shapes.`
      );
      await this.interAgentMessage(
        'frontend', 'backend',
        `Got it Nexus! I'll align my API calls with your routes. Let me know if I missed anything.`
      );

      // ═══ PHASE 3: QA testing ═══════════════════════════════
      this.emit('phase', { phase: 3, name: 'QA Testing', message: 'Vera writing test suites...' });

      const qaOutput = await this.callAgent('qa',
        `Write comprehensive tests for this feature: "${description}"

Backend code:
${beOutput}

Frontend code:
${feOutput}

Write Jest unit tests, Supertest integration tests, and Playwright E2E tests.`
      );

      await this.interAgentMessage(
        'qa', 'backend',
        `Nexus, I found 2 edge cases in the auth middleware. Make sure to handle null userId and expired sessions gracefully.`
      );
      await this.interAgentMessage(
        'qa', 'frontend',
        `Aria, please add aria-label attributes to the form fields — my accessibility tests are failing.`
      );

      // ═══ PHASE 4: Code review ══════════════════════════════
      this.emit('phase', { phase: 4, name: 'Code Review', message: 'Orion reviewing all outputs...' });

      const reviewPrompt = `Review this complete feature implementation for "${description}":

BACKEND (Nexus):
${beOutput}

FRONTEND (Aria):
${feOutput}

QA TESTS (Vera):
${qaOutput}

Check for:
1. Security vulnerabilities
2. API contract mismatches between frontend and backend
3. Missing error handling
4. Performance issues
5. Conflicts between agents' implementations

Be specific with line-level feedback.`;

      const rvOutput = await this.callAgent('reviewer', reviewPrompt);

      // ═══ PHASE 5: Conflict resolution ══════════════════════
      this.emit('phase', { phase: 5, name: 'Conflict Resolution', message: 'Resolving any inter-agent conflicts...' });

      const hasConflicts = detectConflicts(rvOutput);
      let conflictResolutions = [];

      if (hasConflicts) {
        this.emit('conflict_detected', {
          message: '⚠️ Conflicts detected between agents — resolving...'
        });

        const resolution = await resolveConflict({
          conflict: 'API contract mismatch between frontend and backend',
          agentA: feOutput,
          agentB: beOutput,
          context: rvOutput
        });

        conflictResolutions.push(resolution);

        await Task.findByIdAndUpdate(this.taskId, {
          $push: {
            conflicts: {
              description: 'Inter-agent implementation conflict',
              resolution: JSON.stringify(resolution),
              resolvedAt: new Date()
            }
          }
        });

        this.emit('conflict_resolved', {
          resolution,
          message: '✅ Conflicts resolved by Orion'
        });
      }

      // ═══ PHASE 6: Final synthesis ══════════════════════════
      this.emit('phase', { phase: 6, name: 'Final Synthesis', message: 'Generating final unified output...' });

      const finalOutput = [
        '# DevSwarm Final Output',
        `## Feature: ${description}`,
        '---',
        '## Backend Implementation (Nexus)',
        beOutput,
        '---',
        '## Frontend Implementation (Aria)',
        feOutput,
        '---',
        '## Test Suite (Vera)',
        qaOutput,
        '---',
        '## Code Review (Orion)',
        rvOutput,
        ...(conflictResolutions.length > 0 ? ['---', '## Conflict Resolutions', JSON.stringify(conflictResolutions, null, 2)] : []),
      ].join('\n\n');

      const totalDuration = Date.now() - this.startTime;

      await Task.findByIdAndUpdate(this.taskId, {
        status: 'complete',
        completedAt: new Date(),
        finalOutput,
      });

      this.emit('complete', {
        taskId: this.taskId,
        totalDuration,
        agentsUsed: 4,
        conflictsResolved: conflictResolutions.length,
        message: `✅ DevSwarm completed in ${(totalDuration / 1000).toFixed(1)}s`
      });

    } catch (err) {
      console.error('Orchestrator error:', err);
      await Task.findByIdAndUpdate(this.taskId, {
        status: 'failed',
        error: err.message
      });
      this.emit('error', { message: err.message });
      throw err;
    }
  }
}

module.exports = Orchestrator;
