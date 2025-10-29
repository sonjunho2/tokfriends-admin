const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const typescriptModulePath = require.resolve('typescript', {
  paths: [path.join(projectRoot, 'admin-web'), projectRoot],
});
const ts = require(typescriptModulePath);
const adminSrc = path.join(projectRoot, 'admin-web', 'src');
const contractDir = path.join(projectRoot, '_contract');

const allowedAxiosMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

function listSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function canonicalizePath(value) {
  if (!value) return value;
  return value.replace(/\{[^}]+\}/g, '{}');
}

function analyzeUrlArg(arg, sourceFile) {
  if (!arg) {
    return { type: 'missing', raw: null, normalized: null, canonical: null };
  }

  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
    const raw = arg.text;
    const normalized = raw;
    return {
      type: 'static',
      raw,
      normalized,
      canonical: canonicalizePath(normalized),
    };
  }

  if (ts.isTemplateExpression(arg)) {
    let normalized = arg.head.text;
    let raw = arg.head.text;
    for (const span of arg.templateSpans) {
      const expressionText = span.expression.getText(sourceFile).trim();
      const clean = (() => {
        if (ts.isIdentifier(span.expression)) {
          return span.expression.text;
        }
        if (ts.isPropertyAccessExpression(span.expression)) {
          return span.expression.name.text;
        }
        if (ts.isElementAccessExpression(span.expression)) {
          const argument = span.expression.argumentExpression;
          if (argument) {
            return argument.getText(sourceFile).trim();
          }
        }
        return expressionText.replace(/[^a-zA-Z0-9_]+/g, '-');
      })();
      normalized += `{${clean}}` + span.literal.text;
      raw += '${' + expressionText + '}' + span.literal.text;
    }
    return {
      type: 'template',
      raw: '`' + raw + '`',
      normalized,
      canonical: canonicalizePath(normalized),
    };
  }

  return {
    type: 'dynamic',
    raw: arg.getText(sourceFile),
    normalized: null,
    canonical: null,
  };
}

function getFunctionName(node) {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
    if (node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
  }
  if (ts.isArrowFunction(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
    if (ts.isPropertyAssignment(parent)) {
      const name = parent.name;
      if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return String(name.text);
      }
    }
    if (ts.isPropertyDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }
  if (ts.isFunctionExpression(node)) {
    if (node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }
  }
  return '(anonymous)';
}

function analyzeFile(filePath, results) {
  const ext = path.extname(filePath);
  const scriptKind = ext === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind);
  const relativePath = path.relative(projectRoot, filePath);

  const contextStack = [];

  function walk(node) {
    let pushed = false;
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      const name = getFunctionName(node);
      contextStack.push(name || '(anonymous)');
      pushed = true;
    }

    if (ts.isCallExpression(node)) {
      let method = null;
      let client = null;
      let helper = null;
      let urlArgIndex = 0;

      if (ts.isPropertyAccessExpression(node.expression)) {
        const prop = node.expression;
        if (ts.isIdentifier(prop.expression) && prop.expression.text === 'api') {
          const name = prop.name.text;
          if (allowedAxiosMethods.has(name)) {
            method = name.toUpperCase();
            client = 'axios';
          }
        }
      } else if (ts.isIdentifier(node.expression)) {
        const ident = node.expression.text;
        if (ident === 'postJson' || ident === 'postForm') {
          method = 'POST';
          client = 'axios-helper';
          helper = ident;
        } else if (ident === 'fetch') {
          client = 'fetch';
          method = 'GET';
        }
      }

      if (client) {
        if (client === 'fetch' && node.arguments[1]) {
          const opts = node.arguments[1];
          if (ts.isObjectLiteralExpression(opts)) {
            const methodProp = opts.properties.find((prop) => {
              return (
                ts.isPropertyAssignment(prop) &&
                ((ts.isIdentifier(prop.name) && prop.name.text === 'method') ||
                  (ts.isStringLiteral(prop.name) && prop.name.text === 'method'))
              );
            });
            if (methodProp && ts.isPropertyAssignment(methodProp)) {
              const initializer = methodProp.initializer;
              if (ts.isStringLiteral(initializer)) {
                method = initializer.text.toUpperCase();
              } else {
                method = initializer.getText(sourceFile).toUpperCase();
              }
            }
          }
        }

        const urlArg = node.arguments[urlArgIndex];
        const urlInfo = analyzeUrlArg(urlArg, sourceFile);
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const context = contextStack.length > 0 ? contextStack.join(' > ') : '[root]';

        const entry = {
          id: `${relativePath}:${position.line + 1}:${position.character + 1}`,
          file: relativePath.replace(/\\/g, '/'),
          position: { line: position.line + 1, column: position.character + 1 },
          context,
          client,
          helper,
          method,
          url: urlInfo,
        };

        if (client === 'axios' || client === 'axios-helper') {
          const secondArg = node.arguments[1];
          if (secondArg && ts.isObjectLiteralExpression(secondArg)) {
            const hasParams = secondArg.properties.some((prop) =>
              ts.isPropertyAssignment(prop) &&
              ((ts.isIdentifier(prop.name) && prop.name.text === 'params') ||
                (ts.isStringLiteral(prop.name) && prop.name.text === 'params'))
            );
            const hasData = secondArg.properties.some((prop) =>
              ts.isPropertyAssignment(prop) &&
              ((ts.isIdentifier(prop.name) && prop.name.text === 'data') ||
                (ts.isStringLiteral(prop.name) && prop.name.text === 'data'))
            );
            entry.config = { ...entry.config, hasParams, hasData };
          }
        } else if (client === 'fetch' && node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1])) {
          const opts = node.arguments[1];
          const optSummary = {};
          for (const prop of opts.properties) {
            if (!ts.isPropertyAssignment(prop)) continue;
            const nameNode = prop.name;
            let name;
            if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
              name = nameNode.text;
            }
            if (!name) continue;
            if (ts.isStringLiteral(prop.initializer)) {
              optSummary[name] = prop.initializer.text;
            } else {
              optSummary[name] = prop.initializer.getText(sourceFile);
            }
          }
          if (Object.keys(optSummary).length > 0) {
            entry.options = optSummary;
          }
        }

        results.push(entry);
      }
    }

    ts.forEachChild(node, walk);

    if (pushed) {
      contextStack.pop();
    }
  }

  walk(sourceFile);
}

function gatherBaseUrlInfo() {
  const apiFile = path.join(adminSrc, 'lib', 'api.ts');
  const content = fs.readFileSync(apiFile, 'utf8');
  const sourceFile = ts.createSourceFile(apiFile, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const info = {
    envVar: null,
    fallback: null,
    withCredentials: true,
    timeoutMs: null,
  };

  sourceFile.forEachChild((node) => {
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (!ts.isIdentifier(decl.name)) return;
        const name = decl.name.text;
        const initializer = decl.initializer;
        if (!initializer) return;
        if (name === 'ENV_BASE') {
          const text = initializer.getText(sourceFile);
          const match = text.match(/process\.env\.([A-Z0-9_]+)/);
          if (match) {
            info.envVar = match[1];
          }
        }
        if (name === 'FALLBACK_BASE' && ts.isStringLiteral(initializer)) {
          info.fallback = initializer.text;
        }
      });
    }
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (!ts.isIdentifier(decl.name)) return;
        if (decl.name.text === 'api' && decl.initializer && ts.isCallExpression(decl.initializer)) {
          const call = decl.initializer;
          if (ts.isPropertyAccessExpression(call.expression)) {
            const configArg = call.arguments[0];
            if (configArg && ts.isObjectLiteralExpression(configArg)) {
              for (const prop of configArg.properties) {
                if (!ts.isPropertyAssignment(prop)) continue;
                const keyNode = prop.name;
                let key;
                if (ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode)) {
                  key = keyNode.text;
                }
                if (!key) continue;
                if (key === 'timeout') {
                  if (ts.isNumericLiteral(prop.initializer)) {
                    info.timeoutMs = Number(prop.initializer.text);
                  } else {
                    const num = Number(prop.initializer.getText(sourceFile));
                    if (!Number.isNaN(num)) {
                      info.timeoutMs = num;
                    }
                  }
                }
                if (key === 'withCredentials') {
                  info.withCredentials = prop.initializer.kind === ts.SyntaxKind.TrueKeyword;
                }
              }
            }
          }
        }
      });
    }
  });

  return info;
}

function parseOpenApi(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const paths = new Map();
  let currentPath = null;

  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }
    if (/^\s{2}\/[\w\-{}\/.:]*:\s*$/.test(line)) {
      const trimmed = line.trim();
      const pathKey = trimmed.replace(/:$/, '');
      currentPath = pathKey;
      if (!paths.has(pathKey)) {
        paths.set(pathKey, new Set());
      }
      continue;
    }
    if (currentPath && /^\s{4}(get|post|put|patch|delete|head|options):/.test(line)) {
      const method = line.trim().replace(/:$/, '').toUpperCase();
      paths.get(currentPath).add(method);
      continue;
    }
    if (!/^\s/.test(line)) {
      currentPath = null;
    }
  }

  const canonicalMap = new Map();
  for (const [pathKey, methods] of paths.entries()) {
    const canonical = canonicalizePath(pathKey);
    if (!canonicalMap.has(canonical)) {
      canonicalMap.set(canonical, new Set());
    }
    const targetSet = canonicalMap.get(canonical);
    methods.forEach((m) => targetSet.add(m));
  }

  return { raw: paths, canonical: canonicalMap };
}

function main() {
  const files = listSourceFiles(adminSrc);
  const httpCalls = [];
  files.forEach((file) => analyzeFile(file, httpCalls));
  httpCalls.sort((a, b) => {
    if (a.file === b.file) {
      return a.position.line - b.position.line || a.position.column - b.position.column;
    }
    return a.file.localeCompare(b.file);
  });

  const baseInfo = gatherBaseUrlInfo();

  const usage = {
    generatedAt: new Date().toISOString(),
    project: 'tokfriends-admin-web',
    base: {
      envVar: baseInfo.envVar,
      fallback: baseInfo.fallback,
      withCredentials: baseInfo.withCredentials,
      timeoutMs: baseInfo.timeoutMs,
    },
    totals: {
      httpCallCount: httpCalls.length,
      axiosCalls: httpCalls.filter((entry) => entry.client.startsWith('axios')).length,
      fetchCalls: httpCalls.filter((entry) => entry.client === 'fetch').length,
    },
    httpCalls,
  };

  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir);
  }
  const usagePath = path.join(contractDir, 'client-usage-admin.json');
  fs.writeFileSync(usagePath, JSON.stringify(usage, null, 2));

  const openApiPath = path.join(contractDir, 'openapi.yaml');
  const openapi = parseOpenApi(openApiPath);

  const diff = {
    generatedAt: new Date().toISOString(),
    totals: {
      httpCalls: httpCalls.length,
      matched: 0,
      missing: 0,
      methodMismatch: 0,
      unknown: 0,
    },
    details: [],
  };

  for (const call of httpCalls) {
    const detail = {
      id: call.id,
      file: call.file,
      method: call.method,
      url: call.url,
      status: null,
      note: null,
    };
    if (!call.url || !call.url.normalized) {
      detail.status = 'unknown';
      detail.note = 'Dynamic or missing URL cannot be cross-checked.';
      diff.totals.unknown += 1;
    } else {
      const canonical = canonicalizePath(call.url.normalized);
      const openapiMethods = openapi.canonical.get(canonical);
      if (!openapiMethods) {
        detail.status = 'missing';
        detail.note = `Path ${call.url.normalized} not found in OpenAPI.`;
        diff.totals.missing += 1;
      } else if (!openapiMethods.has(call.method)) {
        detail.status = 'method-mismatch';
        detail.note = `Method ${call.method} not defined for path ${call.url.normalized}.`;
        diff.totals.methodMismatch += 1;
      } else {
        detail.status = 'matched';
        diff.totals.matched += 1;
      }
    }
    diff.details.push(detail);
  }

  const diffPath = path.join(contractDir, 'diff-report-admin.json');
  fs.writeFileSync(diffPath, JSON.stringify(diff, null, 2));

  const consoleSummary = {
    totalCalls: usage.totals.httpCallCount,
    baseUrlEnv: usage.base.envVar,
    baseUrlFallback: usage.base.fallback,
    axiosAuthRatio:
      usage.totals.httpCallCount === 0
        ? 0
        : usage.totals.axiosCalls / usage.totals.httpCallCount,
    sampleCalls: httpCalls.slice(0, 5).map((call) => ({
      method: call.method,
      path: call.url ? call.url.normalized || call.url.raw : null,
      file: call.file,
    })),
    diffTotals: diff.totals,
  };

  console.log(JSON.stringify(consoleSummary, null, 2));
}

main();
