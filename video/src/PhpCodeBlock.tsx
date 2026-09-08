import {createHighlighterCoreSync, type ThemeRegistrationRaw} from '@shikijs/core';
import {createJavaScriptRegexEngine} from '@shikijs/engine-javascript';
import php from '@shikijs/langs/php';

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
  ],
};

const phpHighlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [php],
  themes: [phpStormVideoTheme],
});

export const PhpCodeBlock = ({
  className,
  code,
}: {
  className?: string;
  code: string;
}) => {
  const {tokens} = phpHighlighter.codeToTokens(code, {
    lang: 'php',
    theme: 'phpstorm-video',
  });

  return (
    <pre className={className}>
      <code>
        {tokens.map((line, lineIndex) => (
          <span className="shiki-line" key={lineIndex}>
            {line.map((token, tokenIndex) => (
              <span
                key={`${lineIndex}-${tokenIndex}`}
                style={{
                  color: token.color,
                  fontStyle: token.fontStyle === 1 ? 'italic' : undefined,
                  fontWeight: token.fontStyle === 2 ? 800 : undefined,
                  textDecoration: token.fontStyle === 4 ? 'underline' : undefined,
                }}
              >
                {token.content}
              </span>
            ))}
            {lineIndex < tokens.length - 1 ? '\n' : null}
          </span>
        ))}
      </code>
    </pre>
  );
};
