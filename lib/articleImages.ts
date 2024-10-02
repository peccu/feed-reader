const tool =
  "https://article-images.netlify.app/.netlify/functions/feedExtractor?url=";
export async function articleImages(url: string): Promise<string[] | null> {
  try {
    // debugger;
    const response = await fetch(`${tool}${encodeURIComponent(url)}`);
    const data = await response.json();

    if (!response.ok) {
      console.log("image url not found");
      return null;
    }
    return data.urls;
  } catch (err) {
    console.error("Error fetching or parsing the page:", err);
    return null;
  }
}
