import {
  COMPARISON_COLUMNS,
  COMPARISON_NOTE,
  COMPARISON_ROWS,
  OAUTH_TIMING_NOTE,
} from "../lib/comparison";

export function ExtensionComparison({ sourcesOpen = false }: { sourcesOpen?: boolean }) {
  return (
    <div>
      <div
        className="mt-6 overflow-x-auto"
        role="region"
        aria-label="Extension comparison table"
        tabIndex={0}
      >
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm leading-6">
          <caption className="pb-4 text-left text-muted-foreground">
            Coding solutions to GitHub: documented platform support, organization, and
            authentication
          </caption>
          <thead>
            <tr className="border-b-2 border-foreground">
              <th scope="col" className="py-3 pr-5">
                Extension
              </th>
              {COMPARISON_COLUMNS.map((column) => (
                <th key={column.key} scope="col" className="py-3 pr-5">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.url} className="border-b border-border align-top">
                <th scope="row" className="w-48 py-5 pr-5 font-semibold">
                  <a href={row.url} className="underline underline-offset-4">
                    {row.name}
                  </a>
                  <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">
                    {row.variant}
                  </span>
                </th>
                {COMPARISON_COLUMNS.map((column) => (
                  <td key={column.key} className="py-5 pr-5 text-muted-foreground">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5 text-sm leading-7 text-muted-foreground">{COMPARISON_NOTE}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{OAUTH_TIMING_NOTE}</p>
      <details open={sourcesOpen} className="mt-5 border-y border-border py-5">
        <summary className="cursor-pointer text-sm font-semibold">Reviewed source links</summary>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {COMPARISON_ROWS.map((row) => (
            <section key={row.url}>
              <h3 className="font-bold">{row.name}</h3>
              <ul className="mt-2 space-y-2 text-sm leading-6">
                {row.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      className="text-muted-foreground underline underline-offset-4"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
