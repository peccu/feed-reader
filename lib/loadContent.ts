const tool =
  "https://genfeed.netlify.app/.netlify/functions/extract-article-body?url=";
export async function loadContent(url: string): Promise<string | null> {
  try {
    // debugger;
    const target = `${tool}${encodeURIComponent(url)}`;
    console.log(target);
    const response = await fetch(target);
    const data = await response.json();

    if (!response.ok) {
      console.log("content not found");
      return null;
    }
    console.log('response', data);
    return data.content;
  } catch (err) {
    console.error("Error fetching or parsing the page:", err);
    return null;
  }
}
