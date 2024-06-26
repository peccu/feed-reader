import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, ThumbsDown, ThumbsUp } from "lucide-react";
import React from "react";
import { Item } from "./types";
import { sanitize } from "./utils";

interface FeedItemProps {
  item: Item;
  index: number;
  isReversed: boolean;
  handleFeedback: (index: number, type: "like" | "dislike") => void;
  handleSave: (index: number) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({
  item,
  index,
  isReversed,
  handleFeedback,
  handleSave,
}) => {
  return (
    <Card className="w-screen flex-shrink-0 snap-center">
      <CardContent>
        <div className="relative z-20">
          <div
            className={`flex gap-2 ${isReversed ? "justify-start" : "justify-end"}`}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(index, "like")}
            >
              <ThumbsUp className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(index, "dislike")}
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(index)}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
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
          className="mb-2 whitespace-normal text-justify text-sm"
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
              <ThumbsUp className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback(index, "dislike")}
            >
              <ThumbsDown className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(index)}
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <pre className="text-xs">{item.description}</pre>
      <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
    </Card>
  );
};

export default FeedItem;
