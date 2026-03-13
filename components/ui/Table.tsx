import styles from "./Table.module.css";

type TableProps = {
  headers?: React.ReactNode[];
  rows?: React.ReactNode[][];
  children?: React.ReactNode;
};

export function Table({ headers, rows, children }: TableProps) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {children ? (
          children
        ) : (
          <>
            {headers?.length ? (
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={`header-${index}`}>{header}</th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {(rows ?? []).map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </>
        )}
      </table>
    </div>
  );
}
