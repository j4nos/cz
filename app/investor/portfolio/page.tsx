export default function InvestorPortfolioPage() {
  return (
    <section>
      <h1>Portfolio</h1>
      <table>
        <thead>
          <tr>
            <th>Investment</th>
            <th>Ownership</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Budapest Office Seed Listing</td>
            <td>platform</td>
            <td>
              <button type="button">Withdraw in wallet</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
