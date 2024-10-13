export const copy = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard) {
    console.error("Clipboard API not supported");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    console.log("Text copied to clipboard");
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
};
