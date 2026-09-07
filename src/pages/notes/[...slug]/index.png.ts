import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import { SITE } from "@/config";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const notes = await getCollection("notes").then(n =>
    n.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return notes.map(note => ({
    params: { slug: getPath(note.id, note.filePath, false) },
    props: note,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  const buffer = await generateOgImageForPost(props as CollectionEntry<"notes">);
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png" },
  });
};
