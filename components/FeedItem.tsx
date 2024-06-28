import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Item } from "./types";
import { sanitize } from "./utils";

interface FeedItemProps {
  item: Item;
  isReversed: boolean;
}

const pickDescription = (
  description: string | null,
  content: string | null,
): string => {
  if (content == null && description == null) {
    return "";
  }
  if (content == null && description != null) {
    return description;
  }
  if (content != null && description == null) {
    return content;
  }
  if (content != null && description != null) {
    const lastTrimmed =
      description.length > 3 ? description.slice(0, -3) : description;
    return content.startsWith(lastTrimmed) ? content : description;
  }
  return "";
};

const FeedItem: React.FC<FeedItemProps> = ({ item, isReversed }) => {
  return (
    <Card className="w-screen flex-shrink-0 snap-center flex flex-col pt-4 whitespace-normal">
      <div className="flex-grow overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-lg">
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
        <CardContent className="">
          <p className="text-sm text-gray-500 mb-2">
            {item.feed?.title || "Unknown Feed"}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            {new Date(item.pubDate).toLocaleString()}
          </p>
          {/* show categories */}
          <p className="text-sm text-gray-500 mb-2">
            {item.categories?.map((category) => (
              <span
                key={category}
                className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded mb-2"
              >
                {category}
              </span>
            ))}
          </p>
          {/* show enclosure */}
          {item.enclosure?.link && (
            <div className="w-screen -mx-3 md:-mx-6 mb-2 md:mb-4">
              <img src={item.enclosure?.link} alt="enclosure" />
            </div>
          )}
          {/* show the description and content */}
          <p
            className="mb-2 text-justify text-sm"
            dangerouslySetInnerHTML={sanitize(
              pickDescription(item.description, item.content),
              // .replace(/<[^>]*>?/gm, '')
            )}
          ></p>
          {/* read more */}
          <div className="relative z-20">
            <div className="mt-4 flex gap-2 justify-center">
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
        {/* debug output */}
        <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </Card>
  );
};

export default FeedItem;
