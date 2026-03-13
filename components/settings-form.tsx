export function SettingsForm({ role }: { role: string }) {
  return (
    <form>
      <fieldset>
        <legend>{role} settings</legend>
        <label>
          Display name
          <input name="displayName" type="text" />
        </label>
        <label>
          Email
          <input defaultValue={`${role.toLowerCase()}@cityzeen.test`} name="email" type="email" />
        </label>
      </fieldset>
      <button type="submit">Save settings</button>
    </form>
  );
}
