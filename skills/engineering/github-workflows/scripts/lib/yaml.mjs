export class YamlUnreadable extends Error {
  constructor(line, received) {
    super(`Expected supported, valid YAML; received ${received} at line ${line}.`);
    this.name = 'YamlUnreadable';
    this.line = line;
  }
}

function reject(line, received) {
  throw new YamlUnreadable(line, received);
}

// Quotes inside plain shell commands are text, rather than YAML delimiters.
function scan(text, line, visit) {
  let quote = null;
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (quote === '"' && char === '\\') { i += 1; continue; }
      if (char === quote) {
        if (quote === "'" && text[i + 1] === "'") i += 1;
        else quote = null;
      }
      continue;
    }
    if ((char === '"' || char === "'") && (text.slice(0, i).trim() === '' || /(?:^[-?]|[:,\[{])\s*$/.test(text.slice(0, i)))) {
      quote = char;
      continue;
    }
    const result = visit(char, i, depth);
    if (result !== undefined) return result;
    if (char === '[' || char === '{') depth += 1;
    if (char === ']' || char === '}') depth -= 1;
  }
  // A plain scalar may contain an unmatched shell quote; scalar() checks quoted YAML.
  return undefined;
}

function withoutComment(text, line) {
  const index = scan(text, line, (char, i) => char === '#' && (i === 0 || /\s/.test(text[i - 1])) ? i : undefined);
  return (index === undefined ? text : text.slice(0, index)).trimEnd();
}

function colonAt(text, line, flow = false) {
  return scan(text, line, (char, i, depth) => char === ':' && depth === 0 && (flow || i + 1 === text.length || /\s/.test(text[i + 1])) ? i : undefined);
}

function splitFlow(text, line) {
  const parts = [];
  const stack = [];
  let start = 0;
  scan(text, line, (char, i, depth) => {
    if (char === '[' || char === '{') stack.push(char);
    if ((char === ']' || char === '}') && stack.pop() !== (char === ']' ? '[' : '{')) reject(line, 'mismatched flow delimiters');
    if (char === ',' && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  });
  if (stack.length) reject(line, 'an unclosed flow collection');
  parts.push(text.slice(start).trim());
  if (parts.at(-1) === '') parts.pop();
  if (parts.some((part) => !part)) reject(line, 'an empty flow entry');
  return parts;
}

function quoted(text, line) {
  const quote = text[0];
  let result = '';
  const escapes = { '0': '\0', a: '\x07', b: '\b', t: '\t', n: '\n', v: '\v', f: '\f', r: '\r', e: '\x1b', ' ': ' ', '"': '"', '/': '/', '\\': '\\', N: '\u0085', _: '\u00a0', L: '\u2028', P: '\u2029' };
  for (let i = 1; i < text.length; i += 1) {
    const char = text[i];
    if (char === quote) {
      if (quote === "'" && text[i + 1] === "'") { result += "'"; i += 1; continue; }
      if (i !== text.length - 1) reject(line, 'content after a quoted scalar');
      return result;
    }
    if (quote !== '"' || char !== '\\') { result += char; continue; }
    const escape = text[++i];
    if (Object.hasOwn(escapes, escape)) { result += escapes[escape]; continue; }
    const width = { x: 2, u: 4, U: 8 }[escape];
    const digits = text.slice(i + 1, i + 1 + (width ?? 0));
    if (!width || digits.length !== width || !/^[\da-f]+$/i.test(digits) || Number.parseInt(digits, 16) > 0x10ffff) reject(line, 'an invalid quoted escape');
    result += String.fromCodePoint(Number.parseInt(digits, 16));
    i += width;
  }
  reject(line, 'an unclosed quoted scalar');
}

function put(map, key, value, line) {
  if (Object.hasOwn(map, key)) reject(line, 'a duplicate mapping key');
  Object.defineProperty(map, key, { value, enumerable: true, configurable: true, writable: true });
}

function scalar(text, line, inFlow = false) {
  text = text.trim();
  if (!text) return null;
  if (/^[&*!%@`]|^<<$/.test(text)) reject(line, 'an anchor, alias, tag or unsupported scalar');
  if (/^["']/.test(text)) return quoted(text, line);
  if (/^[\[{]/.test(text)) {
    const list = text[0] === '[';
    if (text.at(-1) !== (list ? ']' : '}')) reject(line, 'an unclosed flow collection');
    const parts = splitFlow(text.slice(1, -1), line);
    if (list) return parts.map((part) => scalar(part, line, true));
    const result = {};
    for (const part of parts) {
      const colon = colonAt(part, line, true);
      if (colon === undefined) reject(line, 'a flow mapping without a colon');
      const key = scalar(part.slice(0, colon), line, true);
      if (typeof key !== 'string') reject(line, 'a non-string mapping key');
      put(result, key, scalar(part.slice(colon + 1), line, true), line);
    }
    return result;
  }
  if (colonAt(text, line) !== undefined || /^[\]},>|]|^[-?](?:\s|$)/.test(text) || (inFlow && /[\[\]{},]/.test(text))) reject(line, 'unsupported plain-scalar syntax');
  if (/^(?:null|~)$/i.test(text)) return null;
  if (/^(?:true|false)$/i.test(text)) return text.toLowerCase() === 'true';
  if (/^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[-+]?\d+)?$/i.test(text)) {
    const number = Number(text);
    if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number))) reject(line, 'a number outside the supported range');
    return number;
  }
  if (/^[-+]?(?:0\d+|0x[\da-f]+|0o[0-7]+|\.inf|\.nan|\d[\d_]*:[\d:]+|\d[\d_]*\.\d[\d_]*|\d[\d_]*_\d+)$|^\d{4}-\d\d-\d\d(?:$|[Tt\s])/i.test(text)) reject(line, 'an unsupported numeric or timestamp scalar');
  return text;
}

export function parseYaml(text) {
  if (typeof text !== 'string') reject(1, 'a non-text input');
  const lines = text.replace(/^\ufeff/, '').replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  let index = 0;
  const content = (i) => withoutComment(lines[i], i + 1);
  const indentOf = (i) => lines[i].match(/^ */)[0].length;
  const skip = () => { while (index < lines.length && !content(index).trim()) index += 1; };
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].includes('\t')) reject(i + 1, 'a tab character');
  }

  function blockScalar(header, parentIndent, line) {
    const match = /^([|>])(?:(\d)([+-]?)|([+-])(\d)?)?$/.exec(header);
    if (!match || match[2] === '0' || match[5] === '0') reject(line, 'an unsupported block-scalar header');
    const style = match[1];
    const chomp = match[3] || match[4] || '';
    const explicit = match[2] || match[5];
    let next = index;
    while (next < lines.length && !lines[next].trim()) next += 1;
    const indent = explicit ? parentIndent + Number(explicit) : next < lines.length ? indentOf(next) : parentIndent + 1;
    if (indent <= parentIndent && next < lines.length) return '';
    const body = [];
    while (index < lines.length) {
      if (lines[index].trim() && indentOf(index) < indent) break;
      body.push(lines[index].trim() ? lines[index].slice(indent) : '');
      index += 1;
    }
    let value = '';
    for (let i = 0; i < body.length; i += 1) {
      value += body[i];
      const current = body[i];
      const nextLine = body[i + 1];
      if (style === '|' || nextLine === undefined || /^ /.test(current) || /^ /.test(nextLine ?? '')) value += '\n';
      else if (current && nextLine) value += ' ';
      else if (!current) value += '\n';
    }
    if (chomp === '-') return value.replace(/\n+$/, '');
    if (chomp === '+') return value;
    return value ? value.replace(/\n*$/, '\n') : '';
  }

  function valueOf(valueText, indent, line) {
    if (/^[|>]/.test(valueText)) return blockScalar(valueText, indent, line);
    if (valueText) return scalar(valueText, line);
    skip();
    if (index >= lines.length) return null;
    const nextIndent = indentOf(index);
    if (nextIndent > indent || (nextIndent === indent && /^-(?:\s|$)/.test(content(index).trim()))) return block(nextIndent);
    return null;
  }

  function entry(map, entryText, indent, line) {
    const colon = colonAt(entryText, line);
    if (colon === undefined) reject(line, 'a mapping entry without a colon');
    const keyText = entryText.slice(0, colon).trim();
    const key = /^["']/.test(keyText) ? quoted(keyText, line) : keyText;
    if (!key || /^(?:[?\[{&*!]|<<$)/.test(key)) reject(line, 'an unsupported mapping key');
    const value = valueOf(entryText.slice(colon + 1).trim(), indent, line);
    put(map, key, value, line);
  }

  function block(indent) {
    skip();
    const list = /^-(?:\s|$)/.test(content(index).trim());
    const result = list ? [] : {};
    while (index < lines.length) {
      skip();
      if (index >= lines.length || indentOf(index) < indent) break;
      if (indentOf(index) > indent) reject(index + 1, 'unexpected indentation or a multiline plain scalar');
      const line = index + 1;
      const item = content(index).slice(indent);
      if (/^(?:---|\.\.\.)(?:\s|$)/.test(item)) reject(line, 'multiple documents or a document marker inside a mapping');
      const isItem = /^-(?:\s|$)/.test(item);
      if (list !== isItem) break;
      index += 1;
      if (!list) { entry(result, item, indent, line); continue; }
      const value = item.replace(/^-(?:\s+|$)/, '');
      if (colonAt(value, line) === undefined) { result.push(valueOf(value, indent, line)); continue; }
      const itemIndent = indent + item.length - value.length;
      const map = {};
      entry(map, value, itemIndent, line);
      skip();
      if (index < lines.length && indentOf(index) > indent) {
        if (indentOf(index) !== itemIndent) reject(index + 1, 'misaligned list mapping entries');
        const continuation = block(itemIndent);
        if (Array.isArray(continuation)) reject(index + 1, 'a list instead of mapping entries');
        for (const [key, nestedValue] of Object.entries(continuation)) put(map, key, nestedValue, line);
      }
      result.push(map);
    }
    return result;
  }

  skip();
  if (index < lines.length && content(index) === '---') { index += 1; skip(); }
  if (index >= lines.length) reject(1, 'an empty document instead of a mapping');
  if (indentOf(index) !== 0) reject(index + 1, 'an indented document root');
  let result;
  if (/^[\[{]/.test(content(index))) { result = scalar(content(index), index + 1); index += 1; }
  else result = block(0);
  skip();
  if (index < lines.length && content(index) === '...') { index += 1; skip(); }
  if (index < lines.length) reject(index + 1, 'unconsumed or misaligned YAML');
  if (Array.isArray(result)) reject(1, 'a sequence instead of a workflow mapping');
  return result;
}
