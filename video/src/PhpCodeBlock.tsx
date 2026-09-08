import {createHighlighterCoreSync, type ThemeRegistrationRaw} from '@shikijs/core';
import {createJavaScriptRegexEngine} from '@shikijs/engine-javascript';
import php from '@shikijs/langs/php';
import {Fragment, type HTMLAttributes} from 'react';
import type {ThemedToken} from '@shikijs/core';

const phpStormVideoTheme: ThemeRegistrationRaw = {
  name: 'phpstorm-video',
  type: 'dark',
  colors: {
    'editor.background': '#1e1f22',
    'editor.foreground': '#bcbec4',
  },
  settings: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {foreground: '#7a7e85', fontStyle: 'italic'},
    },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: {foreground: '#d9916a'},
    },
    {
      scope: ['string', 'string.quoted', 'constant.character'],
      settings: {foreground: '#6aaa78'},
    },
    {
      scope: ['constant.numeric', 'constant.language'],
      settings: {foreground: '#2aacb8'},
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.class',
        'support.type',
      ],
      settings: {foreground: '#bcbec4'},
    },
    {
      scope: ['entity.name.function', 'support.function'],
      settings: {foreground: '#56a8f5'},
    },
    {
      scope: [
        'variable',
        'variable.other',
        'variable.language',
        'meta.definition.variable.name',
      ],
      settings: {foreground: '#a985b5'},
    },
    {
      scope: [
        'support.attribute',
        'entity.name.type.attribute',
        'entity.other.attribute-name',
        'support.type.attribute',
      ],
      settings: {foreground: '#b7b74f'},
    },
    {
      scope: ['entity.name.variable.parameter'],
      settings: {foreground: '#589df6'},
    },
    {scope: ['keyword.operator'], settings: {foreground: '#bcbec4'}},
    {scope: ['variable.other.property'], settings: {foreground: '#cf8acb'}},
  ],
};

const phpHighlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [php],
  themes: [phpStormVideoTheme],
});

const tokenCache = new Map<string, ThemedToken[][]>();

const highlight = (code: string) => {
  const cached = tokenCache.get(code);
  if (cached) return cached;
  const {tokens} = phpHighlighter.codeToTokens(code, {lang: 'php', theme: 'phpstorm-video'});
  if (tokenCache.size >= 256) tokenCache.clear();
  tokenCache.set(code, tokens);
  return tokens;
};

const Tokens = ({tokens}: {tokens: ThemedToken[]}) => <>{tokens.map((token, index) => (
  <span key={index} style={{
    display: 'inline', color: token.color,
    fontStyle: (token.fontStyle ?? 0) & 1 ? 'italic' : undefined,
    fontWeight: (token.fontStyle ?? 0) & 2 ? 800 : undefined,
    textDecoration: (token.fontStyle ?? 0) & 4 ? 'underline' : undefined,
  }}>{token.content}</span>
))}</>;

/** Inline snippets keep the typography and layout of their existing code element. */
export const PhpTokens = ({code}: {code: string}) => <>{highlight(code).map((line, index) => (
  <Fragment key={index}>{index > 0 ? '\n' : null}<Tokens tokens={line} /></Fragment>
))}</>;

/** Tokenize the whole snippet, then apply existing per-line layout and animation. */
export const PhpLines = ({code, lineProps = {}}: {
  code: string;
  lineProps?: Record<number, HTMLAttributes<HTMLSpanElement>>;
}) => <>{highlight(code).map((line, index) => {
  const indent = code.split('\n')[index].match(/^ */)![0].length;
  let remaining = indent;
  const visibleTokens = line.flatMap(token => {
    const skip = Math.min(remaining, token.content.length);
    remaining -= skip;
    return token.content.length > skip ? [{...token, content: token.content.slice(skip)}] : [];
  });
  const props = lineProps[index];
  return <span key={index} {...props} className={[
    indent ? `code-line--indent-${indent / 2}` : '', props?.className,
  ].filter(Boolean).join(' ')}><Tokens tokens={visibleTokens} />{visibleTokens.length === 0 ? '\u00a0' : null}</span>;
})}</>;

export const PhpCodeBlock = ({
  className,
  code,
}: {
  className?: string;
  code: string;
}) => {
  return (
    <pre className={className}>
      <code style={{whiteSpace: 'pre'}}><PhpTokens code={code} /></code>
    </pre>
  );
};
