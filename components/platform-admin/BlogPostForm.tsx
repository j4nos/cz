export function BlogPostForm() {
  return (
    <form>
      <fieldset>
        <legend>Blog post</legend>
        <label>
          Title
          <input required type="text" />
        </label>
        <label>
          Excerpt
          <textarea required />
        </label>
        <label>
          Cover image
          <input required type="text" />
        </label>
        <label>
          contentHtml
          <textarea required />
        </label>
        <label>
          Published at
          <input required type="datetime-local" />
        </label>
        <label>
          Status
          <select defaultValue="draft">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
      </fieldset>
      <button type="submit">Save post</button>
    </form>
  );
}
