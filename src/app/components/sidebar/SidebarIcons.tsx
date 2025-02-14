import { FiSun, FiBox, FiSettings } from "react-icons/fi";

interface SidebarIconsProps {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
}

const SidebarIcons = ({
  selectedOption,
  setSelectedOption,
}: SidebarIconsProps) => {
  return (
    <div className="w-fit border-r h-full flex flex-col gap-4 py-4">
      <button
        onClick={() => setSelectedOption("lighting")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "lighting" ? "bg-gray-100" : ""
        }`}
      >
        <FiSun size={25} />
      </button>
      <button
        onClick={() => setSelectedOption("material")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "material" ? "bg-gray-100" : ""
        }`}
      >
        <FiBox size={25} />
      </button>
      <button
        onClick={() => setSelectedOption("render")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "render" ? "bg-gray-100" : ""
        }`}
      >
        <FiSettings size={25} />
      </button>
    </div>
  );
};

export default SidebarIcons;
