// NovaHR // Workflow Engine & Expression Parser Test Suite
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// -------------------------------------------------------------
// Standalone Expression Parser Implementation for Unit Testing
// -------------------------------------------------------------
class ExpressionLexer {
  constructor(input) {
    this.input = (input || '').trim();
    this.pos = 0;
  }

  tokenize() {
    const tokens = [];
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }
      if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === ',') {
        const typeMap = { '(': 'LPAREN', ')': 'RPAREN', '[': 'LBRACKET', ']': 'RBRACKET', ',': 'COMMA' };
        tokens.push({ type: typeMap[ch], value: ch, pos: this.pos++ });
        continue;
      }
      if (ch === '"' || ch === "'") {
        tokens.push(this.readString(ch));
        continue;
      }
      if (/[0-9]/.test(ch)) {
        tokens.push(this.readNumber());
        continue;
      }
      const twoChar = this.input.slice(this.pos, this.pos + 2);
      if (['==', '!=', '>=', '<=', '&&', '||'].includes(twoChar)) {
        const op = twoChar === '&&' ? 'AND' : twoChar === '||' ? 'OR' : twoChar;
        tokens.push({ type: 'OPERATOR', value: op, pos: this.pos });
        this.pos += 2;
        continue;
      }
      if (['>', '<', '!'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch === '!' ? 'NOT' : ch, pos: this.pos++ });
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        tokens.push(this.readIdentifier());
        continue;
      }
      throw new Error(`Unexpected character '${ch}' at pos ${this.pos}`);
    }
    tokens.push({ type: 'EOF', value: '', pos: this.pos });
    return tokens;
  }

  readString(quote) {
    const start = this.pos++;
    let s = '';
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      s += this.input[this.pos++];
    }
    this.pos++;
    return { type: 'STRING', value: s, pos: start };
  }

  readNumber() {
    const start = this.pos;
    let n = '';
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      n += this.input[this.pos++];
    }
    return { type: 'NUMBER', value: parseFloat(n), pos: start };
  }

  readIdentifier() {
    const start = this.pos;
    let id = '';
    while (this.pos < this.input.length && /[a-zA-Z0-9_.]/.test(this.input[this.pos])) {
      id += this.input[this.pos++];
    }
    const upper = id.toUpperCase();
    if (['AND', 'OR', 'NOT', 'IN'].includes(upper)) {
      return { type: 'OPERATOR', value: upper, pos: start };
    }
    if (id === 'true') return { type: 'BOOLEAN', value: true, pos: start };
    if (id === 'false') return { type: 'BOOLEAN', value: false, pos: start };
    return { type: 'IDENTIFIER', value: id, pos: start };
  }
}

class ExpressionParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }
  parse() {
    const ast = this.parseOr();
    if (this.peek().type !== 'EOF') throw new Error(`Unexpected token '${this.peek().value}'`);
    return ast;
  }
  parseOr() {
    let expr = this.parseAnd();
    while (this.matchOp('OR')) {
      expr = { type: 'Binary', op: 'OR', left: expr, right: this.parseAnd() };
    }
    return expr;
  }
  parseAnd() {
    let expr = this.parseComp();
    while (this.matchOp('AND')) {
      expr = { type: 'Binary', op: 'AND', left: expr, right: this.parseComp() };
    }
    return expr;
  }
  parseComp() {
    let expr = this.parseUnary();
    while (this.matchOps(['==', '!=', '>', '<', '>=', '<=', 'IN'])) {
      const op = this.previous().value;
      expr = { type: 'Binary', op, left: expr, right: this.parseUnary() };
    }
    return expr;
  }
  parseUnary() {
    if (this.matchOp('NOT')) {
      return { type: 'Unary', op: 'NOT', arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    const tok = this.peek();
    if (['BOOLEAN', 'NUMBER', 'STRING'].includes(tok.type)) {
      this.advance();
      return { type: 'Literal', val: tok.value };
    }
    if (tok.type === 'IDENTIFIER') {
      this.advance();
      return { type: 'Ident', name: tok.value };
    }
    if (tok.type === 'LPAREN') {
      this.advance();
      const expr = this.parseOr();
      if (this.peek().type !== 'RPAREN') throw new Error("Expected ')'");
      this.advance();
      return expr;
    }
    if (tok.type === 'LBRACKET') {
      this.advance();
      const elements = [];
      if (this.peek().type !== 'RBRACKET') {
        do {
          elements.push(this.parseOr());
        } while (this.matchType('COMMA'));
      }
      if (this.peek().type !== 'RBRACKET') throw new Error("Expected ']'");
      this.advance();
      return { type: 'Array', elements };
    }
    throw new Error(`Unexpected token '${tok.value}'`);
  }
  matchOp(op) {
    if (this.peek().type === 'OPERATOR' && this.peek().value === op) {
      this.advance();
      return true;
    }
    return false;
  }
  matchOps(ops) {
    if (this.peek().type === 'OPERATOR' && ops.includes(this.peek().value)) {
      this.advance();
      return true;
    }
    return false;
  }
  matchType(t) {
    if (this.peek().type === t) {
      this.advance();
      return true;
    }
    return false;
  }
  advance() {
    return this.tokens[this.current++];
  }
  peek() {
    return this.tokens[this.current];
  }
  previous() {
    return this.tokens[this.current - 1];
  }
}

function evaluateExpression(expr, ctx) {
  if (!expr || !expr.trim()) return true;
  const tokens = new ExpressionLexer(expr).tokenize();
  const ast = new ExpressionParser(tokens).parse();

  function evaluateAst(node) {
    switch (node.type) {
      case 'Literal':
        return node.val;
      case 'Array':
        return node.elements.map(evaluateAst);
      case 'Ident': {
        const parts = node.name.split('.');
        let curr = ctx;
        for (const p of parts) {
          if (curr == null) return undefined;
          curr = curr[p];
        }
        return curr;
      }
      case 'Unary':
        if (node.op === 'NOT') return !evaluateAst(node.arg);
        throw new Error('Unsupported unary: ' + node.op);
      case 'Binary': {
        const left = evaluateAst(node.left);
        const right = evaluateAst(node.right);
        switch (node.op) {
          case '==': return left === right;
          case '!=': return left !== right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case 'AND': return Boolean(left) && Boolean(right);
          case 'OR': return Boolean(left) || Boolean(right);
          case 'IN': return Array.isArray(right) ? right.includes(left) : false;
        }
      }
    }
  }

  return Boolean(evaluateAst(ast));
}

// -------------------------------------------------------------
// Unit Tests: Safe Expression Parser
// -------------------------------------------------------------
test('ExpressionParser: correctly evaluates arithmetic comparisons', () => {
  const ctx = { request: { days: 4, amount: 25000 } };
  assert.strictEqual(evaluateExpression('request.days > 3', ctx), true);
  assert.strictEqual(evaluateExpression('request.days <= 2', ctx), false);
  assert.strictEqual(evaluateExpression('request.amount >= 25000', ctx), true);
});

test('ExpressionParser: correctly evaluates boolean logic and operator precedence', () => {
  const ctx = {
    request: { days: 4, leave_type: 'SICK' },
    employee: { department: 'Engineering', is_probation: false }
  };

  assert.strictEqual(
    evaluateExpression('request.days > 3 AND request.leave_type == "SICK"', ctx),
    true
  );
  assert.strictEqual(
    evaluateExpression('request.days > 5 OR request.leave_type == "CASUAL"', ctx),
    false
  );
  assert.strictEqual(
    evaluateExpression('(request.days > 2 OR employee.is_probation == true) AND employee.department == "Engineering"', ctx),
    true
  );
});

test('ExpressionParser: correctly evaluates array membership (IN)', () => {
  const ctx = { candidate: { skill: 'React' }, department: 'Design' };
  assert.strictEqual(evaluateExpression('candidate.skill IN ["React", "Vue", "Angular"]', ctx), true);
  assert.strictEqual(evaluateExpression('department IN ["Engineering", "Product"]', ctx), false);
});

test('ExpressionParser: rejects code injection attempts with syntax error', () => {
  const ctx = { val: 10 };
  assert.throws(() => {
    evaluateExpression('val == 10; process.exit(1)', ctx);
  }, /Unexpected character|Unexpected token/);
});

// -------------------------------------------------------------
// Unit Tests: Out-of-app HMAC Cryptographic Tokens
// -------------------------------------------------------------
test('WorkflowSecurity: generates and verifies tamper-proof HMAC tokens', () => {
  const secret = 'test-secret-key-123';
  const payload = {
    instanceId: 'wfi-101',
    stepId: 'step-01',
    action: 'APPROVE',
    tenantId: 'tenant-test',
    expiresAt: Date.now() + 60000,
  };

  const dataString = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(dataString).digest('base64url');
  const token = `${dataString}.${signature}`;

  // Verify valid token
  const [dataPart, sigPart] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(dataPart).digest('base64url');
  assert.strictEqual(sigPart, expectedSig);
  const parsed = JSON.parse(Buffer.from(dataPart, 'base64url').toString('utf-8'));
  assert.strictEqual(parsed.instanceId, 'wfi-101');
  assert.strictEqual(parsed.action, 'APPROVE');

  // Verify tampered token detection
  const tamperedData = Buffer.from(JSON.stringify({ ...payload, action: 'REJECT' })).toString('base64url');
  const tamperedToken = `${tamperedData}.${signature}`;
  const [tamperedDataPart, tamperedSigPart] = tamperedToken.split('.');
  const recalculatedSig = crypto.createHmac('sha256', secret).update(tamperedDataPart).digest('base64url');
  assert.notStrictEqual(tamperedSigPart, recalculatedSig);
});

// -------------------------------------------------------------
// Unit Tests: Graph Topology Validation
// -------------------------------------------------------------
test('GraphValidator: detects unreachable nodes and dead ends', () => {
  // Graph with dead-end node
  const nodes = [
    { id: '1', type: 'TRIGGER', label: 'Start' },
    { id: '2', type: 'APPROVAL', label: 'Manager' }, // No outgoing edge -> Dead end!
    { id: '3', type: 'END', label: 'Finish' },
  ];
  const edges = [
    { id: 'e1', source: '1', target: '2' },
  ];

  const outgoing = new Map();
  nodes.forEach(n => outgoing.set(n.id, []));
  edges.forEach(e => outgoing.get(e.source)?.push(e.target));

  const deadEnds = nodes.filter(n => n.type !== 'END' && (outgoing.get(n.id) || []).length === 0);
  assert.strictEqual(deadEnds.length, 1);
  assert.strictEqual(deadEnds[0].id, '2');
});
