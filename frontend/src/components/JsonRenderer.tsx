interface Props {
  value: unknown;
  indent?: number;
}

/**
 * Recursively renders a JSON value with syntax highlighting.
 * Extracted from DebugDetailView to enable reuse and reduce component size.
 */
export function JsonRenderer({ value, indent = 0 }: Props) {
  if (value === null) {
    return <span className="json-null text-gray-400">null</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="json-boolean text-cyan-400">{String(value)}</span>;
  }
  if (typeof value === 'number') {
    return <span className="json-number text-cyan-400">{value}</span>;
  }
  if (typeof value === 'string') {
    return <span className="json-string text-amber-400">&quot;{value}&quot;</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    return (
      <>
        {'[\n'}
        {value.map((item, i) => (
          <span key={i}>
            {'  '.repeat(indent + 1)}
            <JsonRenderer value={item} indent={indent + 1} />
            {i < value.length - 1 ? ',\n' : '\n'}
          </span>
        ))}
        {'  '.repeat(indent)}{']'}
      </>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{'{}'}</span>;
    return (
      <>
        {'{\n'}
        {entries.map(([key, val], i) => (
          <span key={key}>
            {'  '.repeat(indent + 1)}
            <span className="json-key text-purple-400">&quot;{key}&quot;</span>
            {': '}
            <JsonRenderer value={val} indent={indent + 1} />
            {i < entries.length - 1 ? ',\n' : '\n'}
          </span>
        ))}
        {'  '.repeat(indent)}
        {'}'}
      </>
    );
  }

  return <>{String(value)}</>;
}
