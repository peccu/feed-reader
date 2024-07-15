import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React from "react";
import { MenuItem } from "./types";

interface ModalMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  menuItems: MenuItem[];
}

const ModalMenu: React.FC<ModalMenuProps> = ({
  isOpen,
  toggleMenu,
  menuItems,
}) => {
  const handleMenuItemClick = (item: MenuItem) => {
    item.onClick();
    toggleMenu();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={toggleMenu}
          className="flex fixed inset-0 z-40 justify-center items-center p-4 bg-black bg-opacity-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg shadow-lg text-foreground bg-background"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">メニュー</h2>
              <Button
                onClick={toggleMenu}
                variant="ghost"
                size="icon"
                className="transition duration-200"
              >
                <X size={24} />
              </Button>
            </div>
            <ul className="p-4 space-y-2">
              {menuItems.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleMenuItemClick(item)}
                  className="flex items-center p-3 rounded transition duration-200 cursor-pointer hover:bg-accent hover:text-accent-foreground gap-2"
                >
                  <span className="w-3">{item.icon && item.icon}</span>
                  <span className="text-lg">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalMenu;
