export default function HomepageCtaPage() {
  return (
    <section>
      <h1>Homepage CTA settings</h1>
      <form>
        <fieldset>
          <legend>First CTA</legend>
          <label>
            Asset ID
            <input defaultValue="asset-1" type="text" />
          </label>
          <label>
            Listing ID
            <input defaultValue="listing-1" type="text" />
          </label>
        </fieldset>
        <fieldset>
          <legend>Second CTA</legend>
          <label>
            Asset ID
            <input defaultValue="asset-2" type="text" />
          </label>
          <label>
            Listing ID
            <input defaultValue="listing-2" type="text" />
          </label>
        </fieldset>
      </form>
    </section>
  );
}
