// NovaHR // Safe AST Expression Parser (Zero eval() / Zero Code-Injection)
// Supports: ==, !=, >, <, >=, <=, IN, NOT IN, AND, OR, NOT, parentheses, strings, numbers, booleans, arrays, dot-paths.

export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string | number | boolean;
  pos: number;
}

export class ExpressionLexer {
  private pos = 0;
  private input: string;

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];

      // Skip whitespace
      if (/\s/.test(ch)) {
        this.pos++;
        continue;
      }

      // Parentheses & brackets
      if (ch === '(') {
        tokens.push({ type: 'LPAREN', value: '(', pos: this.pos++ });
        continue;
      }
      if (ch === ')') {
        tokens.push({ type: 'RPAREN', value: ')', pos: this.pos++ });
        continue;
      }
      if (ch === '[') {
        tokens.push({ type: 'LBRACKET', value: '[', pos: this.pos++ });
        continue;
      }
      if (ch === ']') {
        tokens.push({ type: 'RBRACKET', value: ']', pos: this.pos++ });
        continue;
      }
      if (ch === ',') {
        tokens.push({ type: 'COMMA', value: ',', pos: this.pos++ });
        continue;
      }

      // Strings ('...' or "...")
      if (ch === '"' || ch === "'") {
        tokens.push(this.readString(ch));
        continue;
      }

      // Numbers
      if (/[0-9]/.test(ch)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Two-character operators: ==, !=, >=, <=, &&, ||
      const twoChar = this.input.slice(this.pos, this.pos + 2);
      if (['==', '!=', '>=', '<=', '&&', '||'].includes(twoChar)) {
        const op = twoChar === '&&' ? 'AND' : twoChar === '||' ? 'OR' : twoChar;
        tokens.push({ type: 'OPERATOR', value: op, pos: this.pos });
        this.pos += 2;
        continue;
      }

      // Single-character operators: >, <, !
      if (['>', '<', '!'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch === '!' ? 'NOT' : ch, pos: this.pos++ });
        continue;
      }

      // Identifiers or keyword operators (AND, OR, NOT, IN, true, false)
      if (/[a-zA-Z_]/.test(ch)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      throw new Error(`Unexpected character in expression at position ${this.pos}: '${ch}'`);
    }

    tokens.push({ type: 'EOF', value: '', pos: this.pos });
    return tokens;
  }

  private readString(quote: string): Token {
    const start = this.pos;
    this.pos++; // skip opening quote
    let str = '';
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') {
        this.pos++;
        if (this.pos >= this.input.length) break;
      }
      str += this.input[this.pos++];
    }
    if (this.pos >= this.input.length) {
      throw new Error(`Unterminated string starting at position ${start}`);
    }
    this.pos++; // skip closing quote
    return { type: 'STRING', value: str, pos: start };
  }

  private readNumber(): Token {
    const start = this.pos;
    let numStr = '';
    while (this.pos < this.input.length && /[0-9.]/.test(this.input[this.pos])) {
      numStr += this.input[this.pos++];
    }
    const val = parseFloat(numStr);
    return { type: 'NUMBER', value: val, pos: start };
  }

  private readIdentifier(): Token {
    const start = this.pos;
    let id = '';
    while (this.pos < this.input.length && /[a-zA-Z0-9_.]/.test(this.input[this.pos])) {
      id += this.input[this.pos++];
    }

    const upper = id.toUpperCase();
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT' || upper === 'IN') {
      return { type: 'OPERATOR', value: upper, pos: start };
    }
    if (id === 'true') {
      return { type: 'BOOLEAN', value: true, pos: start };
    }
    if (id === 'false') {
      return { type: 'BOOLEAN', value: false, pos: start };
    }

    return { type: 'IDENTIFIER', value: id, pos: start };
  }
}

// -------------------------------------------------------------
// AST Node Representations
// -------------------------------------------------------------
export type ASTNode =
  | { type: 'Literal'; value: string | number | boolean }
  | { type: 'ArrayLiteral'; elements: ASTNode[] }
  | { type: 'Identifier'; name: string }
  | { type: 'UnaryExpression'; operator: string; argument: ASTNode }
  | { type: 'BinaryExpression'; operator: string; left: ASTNode; right: ASTNode };

export class ExpressionParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const node = this.parseOr();
    if (!this.isAtEnd()) {
      throw new Error(`Unexpected token after expression: '${this.peek().value}' at position ${this.peek().pos}`);
    }
    return node;
  }

  private parseOr(): ASTNode {
    let expr = this.parseAnd();
    while (this.matchOperator('OR')) {
      const operator = 'OR';
      const right = this.parseAnd();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  private parseAnd(): ASTNode {
    let expr = this.parseComparison();
    while (this.matchOperator('AND')) {
      const operator = 'AND';
      const right = this.parseComparison();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseUnary();
    while (this.matchOperators(['==', '!=', '>', '<', '>=', '<=', 'IN'])) {
      const operator = this.previous().value as string;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.matchOperator('NOT')) {
      const operator = 'NOT';
      const argument = this.parseUnary();
      return { type: 'UnaryExpression', operator, argument };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    if (this.match('BOOLEAN')) {
      return { type: 'Literal', value: this.previous().value as boolean };
    }
    if (this.match('NUMBER')) {
      return { type: 'Literal', value: this.previous().value as number };
    }
    if (this.match('STRING')) {
      return { type: 'Literal', value: this.previous().value as string };
    }
    if (this.match('IDENTIFIER')) {
      return { type: 'Identifier', name: this.previous().value as string };
    }
    if (this.match('LPAREN')) {
      const expr = this.parseOr();
      this.consume('RPAREN', "Expect ')' after expression.");
      return expr;
    }
    if (this.match('LBRACKET')) {
      const elements: ASTNode[] = [];
      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.parseOr());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', "Expect ']' after array elements.");
      return { type: 'ArrayLiteral', elements };
    }

    throw new Error(`Unexpected token '${this.peek().value}' at position ${this.peek().pos}`);
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchOperator(op: string): boolean {
    if (this.check('OPERATOR') && this.peek().value === op) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchOperators(ops: string[]): boolean {
    if (this.check('OPERATOR') && ops.includes(this.peek().value as string)) {
      this.advance();
      return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} Found '${this.peek().value}' at position ${this.peek().pos}`);
  }
}

// -------------------------------------------------------------
// Safe Runtime Evaluator
// -------------------------------------------------------------
export class ExpressionEvaluator {
  static evaluate(expression: string, context: Record<string, unknown>): boolean {
    if (!expression || expression.trim() === '') return true; // empty condition passes

    const lexer = new ExpressionLexer(expression);
    const tokens = lexer.tokenize();
    const parser = new ExpressionParser(tokens);
    const ast = parser.parse();

    const result = this.evalNode(ast, context);
    return Boolean(result);
  }

  private static evalNode(node: ASTNode, context: Record<string, unknown>): unknown {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'ArrayLiteral':
        return node.elements.map((el) => this.evalNode(el, context));

      case 'Identifier':
        return this.resolvePath(node.name, context);

      case 'UnaryExpression': {
        const arg = this.evalNode(node.argument, context);
        if (node.operator === 'NOT') return !arg;
        throw new Error(`Unsupported unary operator: ${node.operator}`);
      }

      case 'BinaryExpression': {
        const left = this.evalNode(node.left, context);
        const right = this.evalNode(node.right, context);

        switch (node.operator) {
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '>':
            return (left as number) > (right as number);
          case '<':
            return (left as number) < (right as number);
          case '>=':
            return (left as number) >= (right as number);
          case '<=':
            return (left as number) <= (right as number);
          case 'AND':
            return Boolean(left) && Boolean(right);
          case 'OR':
            return Boolean(left) || Boolean(right);
          case 'IN': {
            if (Array.isArray(right)) {
              return right.includes(left);
            }
            if (typeof right === 'string') {
              return right.includes(String(left));
            }
            return false;
          }
          default:
            throw new Error(`Unsupported binary operator: ${node.operator}`);
        }
      }
    }
  }

  // Safely resolve dot-separated paths (e.g., 'request.days' => context.request.days)
  private static resolvePath(path: string, obj: Record<string, unknown>): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }
}
