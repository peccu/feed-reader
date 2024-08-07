import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import React, { useEffect } from "react";
// import { toast } from "sonner";
import React from "react";
import DynamicSyntaxHighlighter from "./DynamicSyntaxHighlighter";
import { Item, ReadStatuses } from "./types";
import { sanitize } from "./utils";

interface FeedItemProps {
  item: Item;
  isReversed: boolean;
  readStatus: ReadStatuses;
  onRead: () => void;
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
    return content.startsWith(lastTrimmed)
      ? content
      : `${description}<hr/>${content}`;
  }
  return "";
};

const FeedItem: React.FC<FeedItemProps> = ({
  item,
  isReversed,
  readStatus,
  onRead,
}) => {
  /*
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !readStatus[item.link]) {
          toast(`read: ${item.title}`);
          onRead();
        }
      },
      { threshold: 0.5 }, // 50%以上表示されたら既読とみなす
    );

    const element = document.getElementById(`feed-item-${item.link}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [item.link, item.title, readStatus, onRead]);
*/
  return (
    <Card
      id={`feed-item-${item.link}`}
      className={`flex flex-col pt-3 pb-16 whitespace-normal ${
        readStatus[item.link] ? "opacity-50" : ""
      }`}
    >
      <div className="flex-grow overflow-x-hidden overflow-y-auto">
        <CardHeader>
          <CardTitle>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="leading-9"
              onClick={onRead}
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
          <p className="text-sm text-gray-500 mb-2">
            Status: {readStatus[item.link] ? "Read" : "Unread"}
          </p>
          {/* show enclosure */}
          {item.enclosure?.link && (
            <div className="w-screen -mx-3 md:-mx-6 mb-2 md:mb-4">
              <img src={item.enclosure?.link} alt="enclosure" />
            </div>
          )}
          {/* show the description and content */}
          <DynamicSyntaxHighlighter>
            <p
              className="mb-2 text-justify text-sm"
              dangerouslySetInnerHTML={sanitize(
                pickDescription(item.description, item.content),
                // .replace(/<[^>]*>?/gm, '')
              )}
            ></p>
          </DynamicSyntaxHighlighter>
          {/* read more */}
          <div className="relative z-20">
            <div className="mt-4 flex gap-2 justify-center">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block"
                onClick={onRead}
              >
                Read More
              </a>
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <details>
                <summary className="text-sm text-gray-500">Debug</summary>
                <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
              </details>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default FeedItem;
