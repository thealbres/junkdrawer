import { BLOG_PATH, NOTES_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";

// Maps each collection's content directory to its URL base path.
// getPath figures out which collection an entry belongs to from its
// filePath, so callers don't need to know or pass the collection name.
const COLLECTION_PATHS = [
  { contentPath: BLOG_PATH, basePath: "/posts" },
  { contentPath: NOTES_PATH, basePath: "/notes" },
];

/**
 * Get full path of a blog post or note
 * @param id - id of the entry (aka slug)
 * @param filePath - the entry's full file location
 * @param includeBase - whether to include the collection's base path (e.g. `/posts`) in return value
 * @returns entry path
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true
) {
  const collection = COLLECTION_PATHS.find(({ contentPath }) =>
    filePath?.startsWith(contentPath)
  );
  const contentPath = collection?.contentPath ?? BLOG_PATH;

  const pathSegments = filePath
    ?.replace(contentPath, "")
    .split("/")
    .filter(path => path !== "") // remove empty string in the segments ["", "other-path"] <- empty string will be removed
    .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
    .slice(0, -1) // remove the last segment_ file name_ since it's unnecessary
    .map(segment => slugifyStr(segment)); // slugify each segment path

  const basePath = includeBase ? (collection?.basePath ?? "/posts") : "";

  // Making sure `id` does not contain the directory
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1) : blogId;

  // If not inside the sub-dir, simply return the file path
  if (!pathSegments || pathSegments.length < 1) {
    return [basePath, slug].join("/");
  }

  return [basePath, ...pathSegments, slug].join("/");
}
