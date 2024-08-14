import { Item } from "../types";

const FeedReaderPager = ({
  filteredItems,
  currentIndex,
  scrollToIndex,
}: {
  filteredItems: Item[];
  currentIndex: number;
  scrollToIndex: (index: number) => void;
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
      {filteredItems.map((_, index) => (
        <button
          key={index}
          className={`w-2 h-2 rounded-full ${
            index === currentIndex ? "bg-blue-500" : "bg-gray-300"
          }`}
          onClick={() => scrollToIndex(index)}
        />
      ))}
    </div>
  );
};

export default FeedReaderPager;
