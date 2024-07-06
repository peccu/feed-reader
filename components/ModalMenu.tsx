import { X } from "lucide-react";
import React from "react";

interface ModalMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const ModalMenu: React.FC<ModalMenuProps> = ({ isOpen, toggleMenu }) => {
  const clickOne = () => {
    alert(`one`);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={toggleMenu}
          className="z-40 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background text-foreground rounded-lg shadow-lg w-full max-w-md"
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold">メニュー</h2>
              <button onClick={toggleMenu} className="">
                <X size={24} />
              </button>
            </div>
            <ul className="p-4 space-y-2">
              <li
                onClick={clickOne}
                className="p-2 rounded transition duration-200"
              >
                メニュー項目 1
              </li>
              <li className=" p-2 rounded transition duration-200">
                メニュー項目 2
              </li>
              <li className=" p-2 rounded transition duration-200">
                メニュー項目 3
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalMenu;
