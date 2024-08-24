import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2, Plus, Upload, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { DisplayMode } from "./types";

type FeedUrl = {
  url: string;
  type: FeedType;
};
/* type FeedType = "RSS" | "Atom" | "JSON"; */
type FeedType = string;

interface FeedSettingsProps {
  feedUrls: FeedUrl[];
  setFeedUrls: (urls: FeedUrl[]) => void;
  fetchFeeds: () => void;
  loading: boolean;
  displayMode: DisplayMode;
  toggleDisplayMode: () => void;
  toggleSettings: () => void;
}

const FeedSettings: React.FC<FeedSettingsProps> = ({
  feedUrls,
  setFeedUrls,
  fetchFeeds,
  loading,
  displayMode,
  toggleDisplayMode,
  toggleSettings,
}) => {
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedType, setNewFeedType] = useState<FeedType>("RSS");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFeed = () => {
    if (newFeedUrl && !feedUrls.some((feed) => feed.url === newFeedUrl)) {
      setFeedUrls([...feedUrls, { url: newFeedUrl, type: newFeedType }]);
      setNewFeedUrl("");
      setNewFeedType("RSS");
    }
  };

  const removeFeed = (urlToRemove: string) => {
    setFeedUrls(feedUrls.filter((feed) => feed.url !== urlToRemove));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
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
            toast.success("Settings imported successfully");
          }
        } catch (error) {
          console.error("Failed to parse settings file", error);
          toast.error(
            "Failed to import settings. Please check the file format.",
          );
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="relative z-20">
      <CardHeader className="flex flex-row items-center justify-between pt-6">
        <CardTitle>Settings</CardTitle>
        <Button
          onClick={toggleSettings}
          variant="ghost"
          size="icon"
          className="transition duration-200"
        >
          <X size={24} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 m-2">
          {/* useful links */}
          <div className="flex gap-4 mb-2">
            <a
              href="https://feedurl.netlify.app/"
              target="_blank"
              rel="noreferrer"
            >
              Feed URL Extractor
            </a>
            <a href="https://openrss.org/" target="_blank" rel="noreferrer">
              Open RSS
            </a>
            <a
              href="https://genfeed.netlify.app/"
              target="_blank"
              rel="noreferrer"
            >
              GenFeed
            </a>
          </div>
          {/* load button */}
          <Button onClick={fetchFeeds} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Load All Feeds"
            )}
          </Button>
          {/* import export */}
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
          {/* display mode */}
          <div className="flex items-center space-x-2 m-3">
            <Switch
              id="display-mode"
              checked={displayMode === "all"}
              onCheckedChange={toggleDisplayMode}
            />
            <label htmlFor="display-mode">
              {displayMode === "all"
                ? "Showing all items"
                : "Showing unread items only"}
            </label>
          </div>
          {/* add form */}
          <div className="flex gap-2 mb-3">
            <Input
              type="text"
              className="text-base"
              placeholder="Enter new RSS feed URL"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
            />
            <Select value={newFeedType} onValueChange={setNewFeedType}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Feed type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RSS">RSS</SelectItem>
                <SelectItem value="Atom">Atom</SelectItem>
                <SelectItem value="JSON">JSON</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addFeed}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {/* feed urls */}
          {feedUrls.map((feed, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input className="text-base" value={feed.url} readOnly />
              <span className="text-sm text-gray-500">{feed.type}</span>
              <Button
                onClick={() => removeFeed(feed.url)}
                variant="outline"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* bottom */}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedSettings;
