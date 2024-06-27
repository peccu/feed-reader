import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Item } from "./types";
import { sanitize } from "./utils";

interface FeedItemProps {
  item: Item;
  isReversed: boolean;
}

const FeedItem: React.FC<FeedItemProps> = ({ item, isReversed }) => {
  return (
    <Card className="w-screen flex-shrink-0 snap-center flex flex-col pt-4">
      <div className="flex-grow overflow-y-auto">
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
                className="mt-2 inline-block"
              >
                Read More
              </a>
            </div>
          </div>
        </CardContent>
        <pre className="text-xs">{item.description}</pre>
        <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </Card>
  );
};

export default FeedItem;
