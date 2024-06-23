import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DOMPurify from "dompurify";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Plus,
  Repeat,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Rss2JsonResponse {
  status: string;
  feed: Feed;
  items: Item[];
}

interface Feed {
  url: string;
  title: string;
  link: string;
  author: string;
  description: string;
  image: string;
}

interface Item {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure: Enclosure;
  categories: string[];
  feed?: Feed;
}

interface Enclosure {
  link: string;
  type: string;
  length?: string; // Optional as it might not be present in all responses
}

// https://stackoverflow.com/a/60797348
const defaultOptions = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "img",
    "br",
    "div",
    "p",
    "ul",
    "li",
    "ol",
    "h1",
    "pre",
    "code",
    "blockquote",
    "hr",
    "h2",
    "h3",
    "h4",
    "h5",
  ],
  ALLOWED_ATTR: [
    "href",
    "src",
    "target",
    "rel",
    "title",
    "alt",
    "width",
    "height",
  ],
};

const sanitize = (dirty: string) => ({
  __html: DOMPurify.sanitize(dirty, { ...defaultOptions }),
  // __html: dirty,
});

const FeedReader = () => {
  const [feedUrls, setFeedUrls] = useState([
    "https://www.lifehacker.jp/feed/index.xml",
    "https://github.blog/feed/",
    "https://www.publickey1.jp/atom.xml",
    "https://dev.to/feed",
  ]);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [feedItems, setFeedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const feedPromises = feedUrls.map((url) =>
        fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
            url,
          )}`,
        ).then((response) => response.json()),
      );
      const results: Rss2JsonResponse[] = await Promise.all(feedPromises);
      const allItems = results.flatMap((result) => {
        if (result.status === "ok") {
          return result.items.map((item) => {
            item.feed = result.feed;
            return item;
          });
        } else {
          console.error(`Failed to fetch feed: ${result.feed.url}`);
          toast(`Failed to fetch feed: ${result.feed.url}`);
          return [];
        }
      });
      setFeedItems(
        allItems.sort(
          (a, b) =>
            new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
        ),
      );
    } catch (err) {
      setError("An error occurred. Please check the URL or try again later.");
      toast("An error occurred. Please check the URL or try again later.");
    } finally {
      setLoading(false);
    }
  }, [feedUrls]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  useEffect(() => {
    const storedUrls = localStorage.getItem("feedUrls");
    if (storedUrls) {
      setFeedUrls(JSON.parse(storedUrls));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("feedUrls", JSON.stringify(feedUrls));
  }, [feedUrls]);

  useEffect(() => {
    const updateCurrentIndex = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const itemWidth = scrollContainerRef.current.clientWidth;
        setCurrentIndex(Math.round(scrollLeft / itemWidth));
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateCurrentIndex);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", updateCurrentIndex);
      }
    };
  }, []);

  const addFeed = () => {
    if (newFeedUrl && !feedUrls.includes(newFeedUrl)) {
      setFeedUrls([...feedUrls, newFeedUrl]);
      setNewFeedUrl("");
    }
  };

  const removeFeed = (urlToRemove: string) => {
    setFeedUrls(feedUrls.filter((url) => url !== urlToRemove));
  };

  const scrollToNextItem = (direction: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll = currentScroll + direction * containerWidth;
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: "instant",
      });
      // and scroll to top of the article
      scrollContainerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: number,
  ) => {
    e.stopPropagation();
    scrollToNextItem(isReversed ? -direction : direction);
  };

  const toggleDirection = () => {
    setIsReversed(!isReversed);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleFeedback = (index: number, type: "like" | "dislike") => {
    console.log(`Feedback for item ${index}: ${type}`);
    toast(
      `Feedback for item ${index}: ${type}, title: ${feedItems[index].title}`,
    );
    // Here you would typically send this feedback to a server
  };

  const handleSave = (index: number) => {
    console.log(`Saved item ${index}`);
    toast(`Saved item ${index}, title: ${feedItems[index].title}`);
    // Here you would typically save this item to local storage or a server
  };

  const exportSettings = () => {
    const settings = JSON.stringify({ feedUrls });
    const blob = new Blob([settings], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feed_reader_settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          if (settings.feedUrls) {
            setFeedUrls(settings.feedUrls);
            toast("Settings imported successfully");
          }
        } catch (error) {
          console.error("Failed to parse settings file", error);
          setError("Failed to import settings. Please check the file format.");
          toast("Failed to import settings. Please check the file format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-0 relative">
      <Card className="mb-4 relative z-20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Multi-Feed Reader</CardTitle>
          <Button onClick={toggleSettings} variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <div className="flex flex-col gap-2 mb-2">
              {feedUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={url} readOnly />
                  <Button
                    onClick={() => removeFeed(url)}
                    variant="outline"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter new RSS feed URL"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                />
                <Button onClick={addFeed}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={fetchFeeds} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Load All Feeds"
                )}
              </Button>
              <div className="flex gap-2 mt-4">
                <Button onClick={exportSettings} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Settings
                </Button>
                <Button onClick={handleImportClick} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Settings
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".json"
                    onChange={importSettings}
                  />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        <CardContent>
          <div className="flex justify-between items-center">
            {isReversed ? (
              <span onClick={toggleDirection}>
                {currentIndex + 1} / {feedItems.length}
              </span>
            ) : (
              ""
            )}
            <Button onClick={toggleDirection} variant="outline" size="sm">
              <Repeat className="mr-2 h-4 w-4" />
              {isReversed ? "Normal Direction" : "Reverse Direction"}
            </Button>
            {!isReversed ? (
              <span onClick={toggleDirection}>
                {currentIndex + 1} / {feedItems.length}
              </span>
            ) : (
              ""
            )}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div
        className="overflow-x-auto whitespace-nowrap pb-4 relative scroll-auto snap-x snap-mandatory"
        ref={scrollContainerRef}
      >
        <div className="inline-flex">
          {feedItems.map((item, index) => (
            <Card key={index} className="w-screen flex-shrink-0 snap-center">
              <CardHeader>
                <CardTitle className="text-lg whitespace-normal">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2"
                  >
                    {item.title}
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">
                  {item.feed?.title || "Unknown Feed"}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {new Date(item.pubDate).toLocaleString()}
                </p>
                <p
                  className="mb-2 whitespace-normal text-justify"
                  dangerouslySetInnerHTML={sanitize(
                    item.description,
                    // .replace(/<[^>]*>?/gm, '')
                  )}
                ></p>
                <div className="relative z-20">
                  <div
                    className={`mt-4 flex gap-2 ${isReversed ? "justify-start" : "justify-end"}`}
                  >
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2"
                    >
                      Read More
                    </a>
                  </div>
                </div>
                <div className="relative z-20">
                  <div
                    className={`mt-4 flex gap-2 ${isReversed ? "justify-start" : "justify-end"}`}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(index, "like")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFeedback(index, "dislike")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(index)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <pre className="text-xs">{item.description}</pre>
            </Card>
          ))}
        </div>
      </div>
      <div
        className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start cursor-pointer z-10 opacity-25 bg-gradient-to-r from-gray-700 to-transparent"
        onClick={(e) => handleNavClick(e, -1)}
      >
        <ChevronLeft className="text-gray-500 hover:text-gray-700" size={28} />
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end cursor-pointer z-10 opacity-25 bg-gradient-to-l from-gray-700 to-transparent"
        onClick={(e) => handleNavClick(e, 1)}
      >
        <ChevronRight className="text-gray-500 hover:text-gray-700" size={28} />
      </div>
    </div>
  );
};

export default FeedReader;
