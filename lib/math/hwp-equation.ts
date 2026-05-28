const latexGreekToHwp: Record<string, string> = {
  alpha: "alpha",
  beta: "beta",
  gamma: "gamma",
  delta: "delta",
  epsilon: "epsilon",
  varepsilon: "epsilon",
  zeta: "zeta",
  eta: "eta",
  theta: "theta",
  vartheta: "theta",
  iota: "iota",
  kappa: "kappa",
  lambda: "lambda",
  mu: "mu",
  nu: "nu",
  xi: "xi",
  pi: "pi",
  rho: "rho",
  sigma: "sigma",
  tau: "tau",
  upsilon: "upsilon",
  phi: "phi",
  varphi: "phi",
  chi: "chi",
  psi: "psi",
  omega: "omega",
  Gamma: "Gamma",
  Delta: "Delta",
  Theta: "Theta",
  Lambda: "Lambda",
  Xi: "Xi",
  Pi: "Pi",
  Sigma: "Sigma",
  Upsilon: "Upsilon",
  Phi: "Phi",
  Psi: "Psi",
  Omega: "Omega",
};

const latexSymbolToHwp: Record<string, string> = {
  times: "times",
  cdot: "cdot",
  div: "div",
  pm: "+-",
  mp: "-+",
  le: "<=",
  leq: "<=",
  ge: ">=",
  geq: ">=",
  neq: "!=",
  ne: "!=",
  approx: "approx",
  sim: "sim",
  infty: "infty",
  infinity: "infty",
  partial: "partial",
  nabla: "nabla",
  degree: "degree",
  circ: "circ",
  to: "->",
  rightarrow: "->",
  leftarrow: "<-",
  leftrightarrow: "<->",
};

const hwpToLatexGreek: Record<string, string> = {
  alpha: "\\alpha",
  beta: "\\beta",
  gamma: "\\gamma",
  delta: "\\delta",
  epsilon: "\\epsilon",
  zeta: "\\zeta",
  eta: "\\eta",
  theta: "\\theta",
  iota: "\\iota",
  kappa: "\\kappa",
  lambda: "\\lambda",
  mu: "\\mu",
  nu: "\\nu",
  xi: "\\xi",
  pi: "\\pi",
  rho: "\\rho",
  sigma: "\\sigma",
  tau: "\\tau",
  upsilon: "\\upsilon",
  phi: "\\phi",
  chi: "\\chi",
  psi: "\\psi",
  omega: "\\omega",
  Gamma: "\\Gamma",
  Delta: "\\Delta",
  Theta: "\\Theta",
  Lambda: "\\Lambda",
  Xi: "\\Xi",
  Pi: "\\Pi",
  Sigma: "\\Sigma",
  Upsilon: "\\Upsilon",
  Phi: "\\Phi",
  Psi: "\\Psi",
  Omega: "\\Omega",
};

const hwpToLatexSymbol: Record<string, string> = {
  times: "\\times",
  cdot: "\\cdot",
  div: "\\div",
  "+-": "\\pm",
  "-+": "\\mp",
  "<=": "\\leq",
  ">=": "\\geq",
  "!=": "\\neq",
  approx: "\\approx",
  sim: "\\sim",
  infty: "\\infty",
  partial: "\\partial",
  nabla: "\\nabla",
  degree: "^\\circ",
  circ: "\\circ",
  "->": "\\to",
  "<-": "\\leftarrow",
  "<->": "\\leftrightarrow",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMathDelimiters(input: string): string {
  return input
    .replace(/^\s*\$\$?/, "")
    .replace(/\$\$?\s*$/, "")
    .replace(/^\s*\\\[/, "")
    .replace(/\\\]\s*$/, "")
    .replace(/^\s*\\\(/, "")
    .replace(/\\\)\s*$/, "")
    .trim();
}

function readGroup(
  source: string,
  startIndex: number,
  open = "{",
  close = "}"
): { content: string; endIndex: number } | null {
  if (source[startIndex] !== open) return null;

  let depth = 0;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    const previous = source[index - 1];

    if (char === open && previous !== "\\") {
      depth += 1;
    }

    if (char === close && previous !== "\\") {
      depth -= 1;
      if (depth === 0) {
        return {
          content: source.slice(startIndex + 1, index),
          endIndex: index + 1,
        };
      }
    }
  }

  return null;
}

function skipSpaces(source: string, index: number): number {
  let current = index;
  while (/\s/.test(source[current] ?? "")) current += 1;
  return current;
}

function replaceLatexFractions(source: string): string {
  const commands = ["\\frac", "\\dfrac", "\\tfrac"];
  let result = "";
  let index = 0;

  while (index < source.length) {
    const command = commands.find((candidate) =>
      source.startsWith(candidate, index)
    );

    if (!command) {
      result += source[index];
      index += 1;
      continue;
    }

    const numeratorStart = skipSpaces(source, index + command.length);
    const numerator = readGroup(source, numeratorStart);
    if (!numerator) {
      result += source[index];
      index += 1;
      continue;
    }

    const denominatorStart = skipSpaces(source, numerator.endIndex);
    const denominator = readGroup(source, denominatorStart);
    if (!denominator) {
      result += source[index];
      index += 1;
      continue;
    }

    result += `{${convertLatexToHwpEquation(numerator.content)}} over {${convertLatexToHwpEquation(denominator.content)}}`;
    index = denominator.endIndex;
  }

  return result;
}

function replaceLatexSqrts(source: string): string {
  let result = "";
  let index = 0;

  while (index < source.length) {
    if (!source.startsWith("\\sqrt", index)) {
      result += source[index];
      index += 1;
      continue;
    }

    let cursor = skipSpaces(source, index + "\\sqrt".length);
    const degree = source[cursor] === "[" ? readGroup(source, cursor, "[", "]") : null;
    if (degree) cursor = skipSpaces(source, degree.endIndex);

    const radicand = readGroup(source, cursor);
    if (!radicand) {
      result += source[index];
      index += 1;
      continue;
    }

    const convertedRadicand = convertLatexToHwpEquation(radicand.content);
    if (degree) {
      result += `root {${convertLatexToHwpEquation(degree.content)}} {${convertedRadicand}}`;
    } else {
      result += `sqrt {${convertedRadicand}}`;
    }
    index = radicand.endIndex;
  }

  return result;
}

function replaceLatexTextCommands(source: string): string {
  return source.replace(
    /\\(?:text|mathrm|operatorname)\s*\{([^{}]*)\}/g,
    (_match, text: string) => `rm {${text}}`
  );
}

function replaceLatexMatrices(source: string): string {
  return source.replace(
    /\\begin\{(p?matrix|bmatrix|vmatrix|cases)\}([\s\S]*?)\\end\{\1\}/g,
    (_match, matrixType: string, body: string) => {
      const rows = body
        .trim()
        .split(/\\\\/)
        .map((row) =>
          row
            .split("&")
            .map((cell) => convertLatexToHwpEquation(cell.trim()))
            .join(" & ")
        )
        .join(" # ");

      if (matrixType === "cases") return `cases {${rows}}`;
      return `${matrixType} {${rows}}`;
    }
  );
}

function replaceLatexCommands(source: string): string {
  let output = source;

  for (const [latex, hwp] of Object.entries({
    ...latexGreekToHwp,
    ...latexSymbolToHwp,
  }).sort((a, b) => b[0].length - a[0].length)) {
    output = output.replace(
      new RegExp(`\\\\${escapeRegExp(latex)}(?![A-Za-z])`, "g"),
      hwp
    );
  }

  return output;
}

function normalizeLatexSpacing(source: string): string {
  return source
    .replace(/\\left\s*/g, "")
    .replace(/\\right\s*/g, "")
    .replace(/\\limits/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\\:/g, " ")
    .replace(/\\quad/g, " ")
    .replace(/\\qquad/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*([_^])\s*/g, " $1")
    .trim();
}

export function convertLatexToHwpEquation(input: string): string {
  let output = stripMathDelimiters(input);
  output = replaceLatexMatrices(output);
  output = replaceLatexFractions(output);
  output = replaceLatexSqrts(output);
  output = replaceLatexTextCommands(output);
  output = replaceLatexCommands(output);
  output = normalizeLatexSpacing(output);

  return output;
}

function replaceHwpFractions(source: string): string {
  let output = source;
  let previous = "";

  while (previous !== output) {
    previous = output;
    output = output.replace(
      /\{([^{}]+)\}\s+over\s+\{([^{}]+)\}/g,
      (_match, numerator: string, denominator: string) =>
        `\\frac{${convertHwpToLatexEquation(numerator)}}{${convertHwpToLatexEquation(denominator)}}`
    );
  }

  return output.replace(
    /(\S+)\s+over\s+(\S+)/g,
    (_match, numerator: string, denominator: string) =>
      `\\frac{${numerator}}{${denominator}}`
  );
}

function replaceHwpRadicals(source: string): string {
  return source
    .replace(
      /root\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,
      (_match, degree: string, radicand: string) =>
        `\\sqrt[${convertHwpToLatexEquation(degree)}]{${convertHwpToLatexEquation(radicand)}}`
    )
    .replace(
      /sqrt\s*\{([^{}]+)\}/g,
      (_match, radicand: string) =>
        `\\sqrt{${convertHwpToLatexEquation(radicand)}}`
    );
}

function replaceHwpMatrices(source: string): string {
  return source.replace(
    /\b(pmatrix|bmatrix|vmatrix|matrix|cases)\s*\{([^{}]*)\}/g,
    (_match, matrixType: string, body: string) => {
      const rows = body
        .trim()
        .split("#")
        .map((row) =>
          row
            .split("&")
            .map((cell) => convertHwpToLatexEquation(cell.trim()))
            .join(" & ")
        )
        .join(" \\\\ ");

      if (matrixType === "cases") return `\\begin{cases}${rows}\\end{cases}`;
      return `\\begin{${matrixType}}${rows}\\end{${matrixType}}`;
    }
  );
}

function replaceHwpTextCommands(source: string): string {
  return source.replace(
    /rm\s*\{([^{}]*)\}/g,
    (_match, text: string) => `\\mathrm{${text}}`
  );
}

function replaceHwpCommands(source: string): string {
  let output = source;

  for (const [hwp, latex] of Object.entries(hwpToLatexSymbol).sort(
    (a, b) => b[0].length - a[0].length
  )) {
    if (/^[A-Za-z]+$/.test(hwp)) {
      output = output.replace(
        new RegExp(`\\b${escapeRegExp(hwp)}\\b`, "g"),
        latex
      );
    } else {
      output = output.replace(new RegExp(escapeRegExp(hwp), "g"), latex);
    }
  }

  for (const [hwp, latex] of Object.entries(hwpToLatexGreek).sort(
    (a, b) => b[0].length - a[0].length
  )) {
    output = output.replace(
      new RegExp(`\\b${escapeRegExp(hwp)}\\b`, "g"),
      latex
    );
  }

  return output;
}

function normalizeHwpToLatexSpacing(source: string): string {
  return source.replace(/\s+/g, " ").replace(/\s*([_^])\s*/g, "$1").trim();
}

export function convertHwpToLatexEquation(input: string): string {
  let output = input.trim();
  output = replaceHwpMatrices(output);
  output = replaceHwpFractions(output);
  output = replaceHwpRadicals(output);
  output = replaceHwpTextCommands(output);
  output = replaceHwpCommands(output);
  output = normalizeHwpToLatexSpacing(output);

  return output;
}
