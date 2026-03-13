import { blogPosts } from "@/src/ui/mockData";

export function BlogPostsTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Status</th>
          <th>Published</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {blogPosts.map((post) => (
          <tr key={post.id}>
            <td>{post.title}</td>
            <td>{post.status}</td>
            <td>{post.publishedAt}</td>
            <td>{post.updatedAt}</td>
            <td>
              <button type="button">Edit</button> <button type="button">Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
